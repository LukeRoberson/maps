"""
Module: backend.export

Server-side map export engine.
Fetches map tiles, composites them, draws annotations and boundary overlays,
and produces a high-resolution PNG cropped to the map boundary.

Classes:
    ExportService:
        Service class for generating and managing map PNG exports.
"""

import io
import logging
import math
import os
import time
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

import requests
from concurrent.futures import ThreadPoolExecutor, as_completed
from flask import current_app
from PIL import Image, ImageDraw, ImageFont

from backend.annotation import AnnotationModel, AnnotationService
from backend.boundary import BoundaryService
from backend.layer import LayerService
from backend.map import MapService
from backend.tile_config import TileLayerConfig, get_tile_config

logger = logging.getLogger(__name__)

# Tile size in pixels (standard Web Mercator tiles)
TILE_PX = 256
# Maximum image dimension (pixels per axis) to avoid enormous exports
MAX_IMAGE_PX = 8000
# Padding fraction added around the boundary bounding box
BBOX_PADDING = 0.05
# HTTP timeout for tile fetches
TILE_FETCH_TIMEOUT = 10
# Number of concurrent tile-fetch threads
TILE_FETCH_WORKERS = 8


# ---------------------------------------------------------------------------
# Coordinate math  (Slippy-map / Web Mercator helpers)
# ---------------------------------------------------------------------------

def _lat_lon_to_tile(lat: float, lon: float, zoom: int) -> Tuple[int, int]:
    """Convert lat/lon to tile x/y at *zoom*."""
    n = 2 ** zoom
    x = int((lon + 180.0) / 360.0 * n)
    lat_rad = math.radians(lat)
    y = int((1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n)
    # Clamp
    x = max(0, min(n - 1, x))
    y = max(0, min(n - 1, y))
    return x, y


def _lat_lon_to_pixel(
    lat: float, lon: float, zoom: int, tile_size: int = TILE_PX
) -> Tuple[float, float]:
    """Convert lat/lon to absolute pixel coordinates at *zoom*."""
    n = 2 ** zoom
    px = (lon + 180.0) / 360.0 * n * tile_size
    lat_rad = math.radians(lat)
    py = (1.0 - math.log(math.tan(lat_rad) + 1.0 / math.cos(lat_rad)) / math.pi) / 2.0 * n * tile_size
    return px, py


def _compute_bbox(
    coordinates: List[List[float]], padding: float = BBOX_PADDING
) -> Tuple[float, float, float, float]:
    """Return (min_lat, min_lon, max_lat, max_lon) with padding."""
    lats = [c[0] for c in coordinates]
    lons = [c[1] for c in coordinates]
    min_lat, max_lat = min(lats), max(lats)
    min_lon, max_lon = min(lons), max(lons)
    lat_pad = (max_lat - min_lat) * padding
    lon_pad = (max_lon - min_lon) * padding
    return (
        min_lat - lat_pad, min_lon - lon_pad,
        max_lat + lat_pad, max_lon + lon_pad
    )


def _auto_zoom(
    bbox: Tuple[float, float, float, float],
    max_px: int = MAX_IMAGE_PX,
    tile_size: int = TILE_PX,
    max_zoom: int = 19,
) -> int:
    """Pick the highest zoom where the bbox fits within *max_px* per axis."""
    min_lat, min_lon, max_lat, max_lon = bbox
    for z in range(max_zoom, 0, -1):
        px_tl = _lat_lon_to_pixel(max_lat, min_lon, z, tile_size)
        px_br = _lat_lon_to_pixel(min_lat, max_lon, z, tile_size)
        width = abs(px_br[0] - px_tl[0])
        height = abs(px_br[1] - px_tl[1])
        if width <= max_px and height <= max_px:
            return z
    return 1


# ---------------------------------------------------------------------------
# Tile fetching
# ---------------------------------------------------------------------------

def _build_tile_url(
    url_template: str,
    x: int, y: int, z: int,
    subdomains: List[str],
    retina: bool = True,
) -> str:
    """Expand a Slippy-map URL template."""
    s = subdomains[((x + y) % len(subdomains))] if subdomains else ''
    r = '@2x' if retina else ''
    return (
        url_template
        .replace('{s}', s)
        .replace('{z}', str(z))
        .replace('{x}', str(x))
        .replace('{y}', str(y))
        .replace('{r}', r)
    )


def _fetch_tile(url: str, session: Optional[requests.Session] = None) -> Optional[Image.Image]:
    """Download a single tile, return as Pillow Image or None."""
    try:
        getter = session if session is not None else requests
        resp = getter.get(url, timeout=TILE_FETCH_TIMEOUT)
        if resp.status_code == 200:
            return Image.open(io.BytesIO(resp.content)).convert('RGBA')
    except Exception as exc:
        logger.warning("Tile fetch failed %s: %s", url, exc)
    return None


def _fetch_and_stitch(
    url_template: str,
    subdomains: List[str],
    x_min: int, x_max: int,
    y_min: int, y_max: int,
    zoom: int,
    retina: bool = True,
) -> Image.Image:
    """Fetch a grid of tiles concurrently and stitch into a single image."""
    tile_size = TILE_PX * 2 if retina else TILE_PX
    cols = x_max - x_min + 1
    rows = y_max - y_min + 1
    canvas = Image.new('RGBA', (cols * tile_size, rows * tile_size), (255, 255, 255, 255))

    session = requests.Session()
    adapter = requests.adapters.HTTPAdapter(
        pool_connections=TILE_FETCH_WORKERS,
        pool_maxsize=TILE_FETCH_WORKERS,
    )
    session.mount('http://', adapter)
    session.mount('https://', adapter)
    session.headers['User-Agent'] = 'PrintableMaps/1.0 (export)'

    def fetch_one(tx: int, ty: int) -> Tuple[int, int, Optional[Image.Image]]:
        url = _build_tile_url(url_template, tx, ty, zoom, subdomains, retina)
        img = _fetch_tile(url, session)
        if img is None:
            time.sleep(0.2)
            img = _fetch_tile(url, session)
        if img is not None and img.size != (tile_size, tile_size):
            img = img.resize((tile_size, tile_size), Image.LANCZOS)
        return tx, ty, img

    tiles = [
        (tx, ty)
        for ty in range(y_min, y_max + 1)
        for tx in range(x_min, x_max + 1)
    ]

    with ThreadPoolExecutor(max_workers=TILE_FETCH_WORKERS) as executor:
        futures = {executor.submit(fetch_one, tx, ty): (tx, ty) for tx, ty in tiles}
        for future in as_completed(futures):
            tx, ty, tile_img = future.result()
            if tile_img is not None:
                px = (tx - x_min) * tile_size
                py = (ty - y_min) * tile_size
                canvas.paste(tile_img, (px, py))

    return canvas


# ---------------------------------------------------------------------------
# Label overlay compositing
# ---------------------------------------------------------------------------

def _composite_labels(
    base: Image.Image,
    label_url_template: str,
    label_subdomains: List[str],
    base_x_min: int, base_y_min: int,
    base_x_max: int, base_y_max: int,
    zoom: int,
    zoom_offset: int,
    retina: bool = True,
) -> Image.Image:
    """
    Fetch label tiles and alpha-composite on top of *base*.

    When zoom_offset is negative (e.g. -1), labels are fetched at a lower
    zoom → each label tile covers a larger geographic area → text is larger.
    The label image is then scaled to match the base pixel dimensions.
    """
    tile_size = TILE_PX * 2 if retina else TILE_PX
    label_zoom = max(1, zoom + zoom_offset)

    if label_zoom == zoom and zoom_offset == 0:
        # Same zoom – stitch the same tile grid
        labels = _fetch_and_stitch(
            label_url_template, label_subdomains,
            base_x_min, base_x_max, base_y_min, base_y_max,
            zoom, retina,
        )
        if labels.size != base.size:
            labels = labels.resize(base.size, Image.LANCZOS)
        return Image.alpha_composite(base, labels)

    # Different zoom: compute the tile range at label_zoom from the
    # geographic area covered by the base tiles.
    # Base tile corners → lat/lon → label tile range
    base_n = 2 ** zoom
    label_n = 2 ** label_zoom
    ratio = label_n / base_n  # < 1 when zoom_offset < 0

    lx_min = int(base_x_min * ratio)
    lx_max = int(base_x_max * ratio)
    ly_min = int(base_y_min * ratio)
    ly_max = int(base_y_max * ratio)

    label_canvas = _fetch_and_stitch(
        label_url_template, label_subdomains,
        lx_min, lx_max, ly_min, ly_max,
        label_zoom, retina,
    )

    # Compute how the label tile grid maps onto the base pixel grid.
    # Top-left of label grid in absolute label-zoom pixels:
    label_origin_px = lx_min * tile_size
    label_origin_py = ly_min * tile_size
    # Top-left of base grid in absolute base-zoom pixels, then scaled:
    base_origin_in_label_px = base_x_min * tile_size * ratio
    base_origin_in_label_py = base_y_min * tile_size * ratio
    # Size of base canvas in label-zoom pixels:
    base_w_label = base.width * ratio
    base_h_label = base.height * ratio

    # Crop region within the label canvas
    crop_left = base_origin_in_label_px - label_origin_px
    crop_top = base_origin_in_label_py - label_origin_py
    crop_right = crop_left + base_w_label
    crop_bottom = crop_top + base_h_label

    # Clamp to label canvas
    crop_left = max(0, int(crop_left))
    crop_top = max(0, int(crop_top))
    crop_right = min(label_canvas.width, int(crop_right))
    crop_bottom = min(label_canvas.height, int(crop_bottom))

    cropped = label_canvas.crop((crop_left, crop_top, crop_right, crop_bottom))
    # Scale up to match the base canvas size
    scaled = cropped.resize(base.size, Image.LANCZOS)
    return Image.alpha_composite(base, scaled)


# ---------------------------------------------------------------------------
# Annotation drawing
# ---------------------------------------------------------------------------

def _coord_to_px(
    lat: float, lon: float,
    zoom: int, tile_size: int,
    origin_px: float, origin_py: float,
) -> Tuple[int, int]:
    """Map a lat/lon to pixel position on the stitched canvas."""
    abs_px, abs_py = _lat_lon_to_pixel(lat, lon, zoom, tile_size)
    return int(abs_px - origin_px), int(abs_py - origin_py)


def _parse_color(style: Dict[str, Any], key: str = 'color', default: str = '#3388ff') -> str:
    """Extract a colour string from annotation style."""
    return style.get(key, default) or default


_FONT_CANDIDATES = [
    "arial.ttf",
    "C:/Windows/Fonts/arial.ttf",
    "/usr/share/fonts/dejavu/DejaVuSans-Bold.ttf",   # Alpine (font-dejavu)
    "/usr/share/fonts/dejavu/DejaVuSans.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Debian/Ubuntu
    "/usr/share/fonts/TTF/DejaVuSans.ttf",              # Arch
]


def _load_font(size: int) -> ImageFont.FreeTypeFont:
    """Load a TrueType font at *size* px, falling back gracefully."""
    for path in _FONT_CANDIDATES:
        try:
            return ImageFont.truetype(path, size)
        except OSError:
            continue
    # Pillow >= 10 supports size= on the built-in vector font
    try:
        return ImageFont.load_default(size=size)  # type: ignore[call-arg]
    except TypeError:
        return ImageFont.load_default()


def _draw_annotations(
    image: Image.Image,
    annotations: List[AnnotationModel],
    zoom: int,
    tile_size: int,
    origin_px: float,
    origin_py: float,
) -> None:
    """Render annotations onto the image in-place."""
    draw = ImageDraw.Draw(image)

    for ann in annotations:
        style = ann.style or {}
        color = _parse_color(style)
        weight = int(style.get('weight', 3))
        opacity = float(style.get('opacity', 1.0))
        fill_color = _parse_color(style, 'fillColor', color)
        fill_opacity = float(style.get('fillOpacity', 0.2))

        if ann.annotation_type == 'line':
            coords = ann.coordinates  # [[lat, lon], ...]
            if len(coords) >= 2:
                points = [
                    _coord_to_px(c[0], c[1], zoom, tile_size, origin_px, origin_py)
                    for c in coords
                ]
                # Draw line with width
                for i in range(len(points) - 1):
                    draw.line(
                        [points[i], points[i + 1]],
                        fill=color,
                        width=max(1, weight),
                    )

        elif ann.annotation_type == 'polygon':
            coords = ann.coordinates  # [[lat, lon], ...]
            if len(coords) >= 3:
                points = [
                    _coord_to_px(c[0], c[1], zoom, tile_size, origin_px, origin_py)
                    for c in coords
                ]
                # Fill
                _r, _g, _b = _hex_to_rgb(fill_color)
                fill_rgba = (_r, _g, _b, int(fill_opacity * 255))
                overlay = Image.new('RGBA', image.size, (0, 0, 0, 0))
                overlay_draw = ImageDraw.Draw(overlay)
                overlay_draw.polygon(points, fill=fill_rgba)
                image.paste(Image.alpha_composite(image, overlay), (0, 0))
                draw = ImageDraw.Draw(image)  # Refresh draw context
                # Outline
                draw.polygon(points, outline=color)

        elif ann.annotation_type == 'text':
            coord = ann.coordinates  # [lat, lon]
            if coord:
                lat_val = coord[0] if isinstance(coord[0], (int, float)) else coord[0][0]
                lon_val = coord[1] if isinstance(coord[1], (int, float)) else coord[0][1]
                px, py = _coord_to_px(lat_val, lon_val, zoom, tile_size, origin_px, origin_py)
                font_size = int(style.get('fontSize', 20))
                # Scale to match on-screen visual weight: 3x retina-aware factor
                scaled_size = max(24, font_size * tile_size // TILE_PX * 3)
                font = _load_font(scaled_size)
                text = ann.content or ''
                if text:
                    # Thicker outline (±2 px) for readability on busy backgrounds
                    for dx in range(-2, 3):
                        for dy in range(-2, 3):
                            if dx or dy:
                                draw.text((px + dx, py + dy), text, fill='white', font=font)
                    draw.text((px, py), text, fill=color, font=font)

        elif ann.annotation_type == 'marker':
            coord = ann.coordinates  # [lat, lon]
            if coord:
                lat_val = coord[0] if isinstance(coord[0], (int, float)) else coord[0][0]
                lon_val = coord[1] if isinstance(coord[1], (int, float)) else coord[0][1]
                px, py = _coord_to_px(lat_val, lon_val, zoom, tile_size, origin_px, origin_py)
                r = max(10, tile_size // 20)
                draw.ellipse([px - r, py - r, px + r, py + r], fill=color, outline='white', width=3)
                # Label text beside the marker
                if ann.content:
                    label_size = max(20, tile_size // 8)
                    font = _load_font(label_size)
                    for dx in range(-2, 3):
                        for dy in range(-2, 3):
                            if dx or dy:
                                draw.text((px + r + 6 + dx, py - r + dy), ann.content, fill='white', font=font)
                    draw.text((px + r + 6, py - r), ann.content, fill=color, font=font)


def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Convert hex colour string to (R, G, B) tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join(c * 2 for c in hex_color)
    if len(hex_color) != 6:
        return (51, 136, 255)  # Leaflet default blue
    return (
        int(hex_color[0:2], 16),
        int(hex_color[2:4], 16),
        int(hex_color[4:6], 16),
    )


# ---------------------------------------------------------------------------
# Boundary drawing & fade mask
# ---------------------------------------------------------------------------

def _draw_boundary_outline(
    image: Image.Image,
    coordinates: List[List[float]],
    zoom: int, tile_size: int,
    origin_px: float, origin_py: float,
    color: str = '#e74c3c',
    width: int = 3,
) -> None:
    """Draw the map boundary outline on the image."""
    draw = ImageDraw.Draw(image)
    points = [
        _coord_to_px(c[0], c[1], zoom, tile_size, origin_px, origin_py)
        for c in coordinates
    ]
    if len(points) >= 3:
        # Close the polygon
        points.append(points[0])
        for i in range(len(points) - 1):
            draw.line([points[i], points[i + 1]], fill=color, width=width)


def _apply_boundary_fade(
    image: Image.Image,
    coordinates: List[List[float]],
    zoom: int, tile_size: int,
    origin_px: float, origin_py: float,
    fade_alpha: int = 200,
) -> Image.Image:
    """
    Apply a semi-transparent white mask outside the boundary polygon.
    Returns a new image.
    """
    w, h = image.size
    # Create a mask where the boundary interior is transparent (0)
    # and the exterior is white with fade_alpha
    mask = Image.new('RGBA', (w, h), (255, 255, 255, fade_alpha))
    mask_draw = ImageDraw.Draw(mask)

    points = [
        _coord_to_px(c[0], c[1], zoom, tile_size, origin_px, origin_py)
        for c in coordinates
    ]
    if len(points) >= 3:
        # Punch a transparent hole for the interior
        mask_draw.polygon(points, fill=(0, 0, 0, 0))

    return Image.alpha_composite(image, mask)


# ---------------------------------------------------------------------------
# Main ExportService class
# ---------------------------------------------------------------------------

class ExportService:
    """
    Service class for exporting maps as high-resolution PNG images.

    The generate() method orchestrates the full pipeline:
      1. Load map area, boundary, layers, annotations from DB
      2. Compute bounding box & auto-select zoom
      3. Fetch & stitch base tiles
      4. Composite label overlay (if tile layer has one)
      5. Draw annotations
      6. Draw boundary outline (optional)
      7. Apply boundary fade mask
      8. Crop to exact bounding box
      9. Return PNG bytes
    """

    def __init__(self, export_folder: str) -> None:
        self.export_folder = export_folder
        if not os.path.exists(self.export_folder):
            os.makedirs(self.export_folder)

    # Keep legacy helpers for the old download route
    def get_export_path(self, filename: str) -> Optional[str]:
        filepath = os.path.join(self.export_folder, filename)
        if os.path.exists(filepath):
            return filepath
        return None

    def generate(
        self,
        map_area_id: int,
        zoom: Optional[int] = None,
        include_annotations: bool = True,
        include_boundary: bool = True,
        tile_layer: Optional[str] = None,
    ) -> Tuple[bytes, str]:
        """
        Generate a PNG export for a map area.

        Returns:
            Tuple of (png_bytes, filename)

        Raises:
            ValueError: If map area or boundary not found.
        """
        # --- Load data from DB ---
        map_service = MapService()
        map_area = map_service.read(map_id=map_area_id)
        if not map_area:
            raise ValueError(f"Map area {map_area_id} not found")

        boundary_service = BoundaryService()
        boundary = boundary_service.read(map_id=map_area_id)
        if not boundary or not boundary.coordinates:
            raise ValueError(
                f"Map area '{map_area.name}' has no boundary. "
                "A boundary is required for export."
            )

        coords = boundary.coordinates  # [[lat, lon], ...]

        # --- Tile config ---
        # Use explicitly passed tile_layer, fall back to map area's saved value
        tile_cfg = get_tile_config(tile_layer or map_area.tile_layer)
        retina = tile_cfg.retina
        tile_size = TILE_PX * 2 if retina else TILE_PX
        max_tile_zoom = tile_cfg.max_zoom

        # --- Bounding box & zoom ---
        bbox = _compute_bbox(coords)
        if zoom is None:
            zoom = _auto_zoom(bbox, MAX_IMAGE_PX, tile_size, max_tile_zoom)
        zoom = max(1, min(zoom, max_tile_zoom))

        min_lat, min_lon, max_lat, max_lon = bbox

        # Tile range
        tx_min, ty_min = _lat_lon_to_tile(max_lat, min_lon, zoom)
        tx_max, ty_max = _lat_lon_to_tile(min_lat, max_lon, zoom)
        # Ensure min <= max
        if tx_min > tx_max:
            tx_min, tx_max = tx_max, tx_min
        if ty_min > ty_max:
            ty_min, ty_max = ty_max, ty_min

        logger.info(
            "Export map_area=%d zoom=%d tiles=(%d-%d, %d-%d) retina=%s",
            map_area_id, zoom, tx_min, tx_max, ty_min, ty_max, retina,
        )

        # --- Fetch & stitch base tiles ---
        canvas = _fetch_and_stitch(
            tile_cfg.url, tile_cfg.subdomains,
            tx_min, tx_max, ty_min, ty_max,
            zoom, retina,
        )

        # --- Label overlay ---
        if tile_cfg.label_overlay_url:
            canvas = _composite_labels(
                canvas,
                tile_cfg.label_overlay_url,
                tile_cfg.label_overlay_subdomains,
                tx_min, ty_min, tx_max, ty_max,
                zoom,
                tile_cfg.label_overlay_zoom_offset,
                retina,
            )

        # --- Canvas pixel origin (absolute px of top-left tile corner) ---
        origin_px = tx_min * tile_size
        origin_py = ty_min * tile_size

        # --- Draw annotations ---
        if include_annotations:
            layer_service = LayerService()
            annotation_service = AnnotationService()
            all_layers = layer_service.read(map_id=map_area_id)
            all_annotations: List[AnnotationModel] = []
            for layer in all_layers:
                if layer.visible and layer.layer_type in ('annotation', 'custom'):
                    anns = annotation_service.read(layer_id=layer.id)
                    all_annotations.extend(anns)
            if all_annotations:
                _draw_annotations(
                    canvas, all_annotations,
                    zoom, tile_size, origin_px, origin_py,
                )

        # --- Boundary fade mask ---
        canvas = _apply_boundary_fade(
            canvas, coords, zoom, tile_size, origin_px, origin_py,
        )

        # --- Boundary outline ---
        if include_boundary:
            _draw_boundary_outline(
                canvas, coords, zoom, tile_size, origin_px, origin_py,
            )

        # --- Crop to bounding box ---
        tl_px, tl_py = _coord_to_px(max_lat, min_lon, zoom, tile_size, origin_px, origin_py)
        br_px, br_py = _coord_to_px(min_lat, max_lon, zoom, tile_size, origin_px, origin_py)
        crop_left = max(0, min(tl_px, br_px))
        crop_top = max(0, min(tl_py, br_py))
        crop_right = min(canvas.width, max(tl_px, br_px))
        crop_bottom = min(canvas.height, max(tl_py, br_py))

        if crop_right > crop_left and crop_bottom > crop_top:
            canvas = canvas.crop((crop_left, crop_top, crop_right, crop_bottom))

        # --- Convert to RGB (PNG with no alpha needed) ---
        final = Image.new('RGB', canvas.size, (255, 255, 255))
        final.paste(canvas, (0, 0), canvas)

        # --- Encode PNG ---
        buf = io.BytesIO()
        final.save(buf, format='PNG', compress_level=6)
        png_bytes = buf.getvalue()

        # --- Filename ---
        sanitized_name = "".join(
            c if c.isalnum() or c in (' ', '-', '_') else '_'
            for c in map_area.name
        ).strip().replace(' ', '_')
        timestamp = datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')
        filename = f"{sanitized_name}_{timestamp}.png"

        # --- Optionally save to disk ---
        filepath = os.path.join(self.export_folder, filename)
        with open(filepath, 'wb') as f:
            f.write(png_bytes)

        logger.info(
            "Export complete: %s (%d bytes, %dx%d)",
            filename, len(png_bytes), final.width, final.height,
        )

        return png_bytes, filename
