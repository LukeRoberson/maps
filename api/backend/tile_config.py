"""
Module: backend.tile_config

Tile layer URL configurations for server-side map export.
Mirrors the frontend tile-layers.ts definitions but only includes
the URL templates needed for tile fetching.

Only known tile provider URLs are allowed to prevent SSRF.
"""

from typing import Dict, List, Optional


class TileLayerConfig:
    """Configuration for a single tile layer."""

    def __init__(
        self,
        tile_id: str,
        url: str,
        subdomains: List[str],
        max_zoom: int,
        retina: bool = True,
        zoom_offset: int = 0,
        label_overlay_url: Optional[str] = None,
        label_overlay_subdomains: Optional[List[str]] = None,
        label_overlay_zoom_offset: int = 0,
    ) -> None:
        self.tile_id = tile_id
        self.url = url
        self.subdomains = subdomains
        self.max_zoom = max_zoom
        self.retina = retina
        self.zoom_offset = zoom_offset
        self.label_overlay_url = label_overlay_url
        self.label_overlay_subdomains = label_overlay_subdomains or subdomains
        self.label_overlay_zoom_offset = label_overlay_zoom_offset


# Registry of known tile layers (prevents SSRF from arbitrary URLs)
TILE_LAYERS: Dict[str, TileLayerConfig] = {

    'carto-voyager': TileLayerConfig(
        tile_id='carto-voyager',
        url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png',
        subdomains=['a', 'b', 'c', 'd'],
        max_zoom=20,
        label_overlay_url='https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png',
        label_overlay_subdomains=['a', 'b', 'c', 'd'],
        label_overlay_zoom_offset=-1,
    ),

    'carto-light': TileLayerConfig(
        tile_id='carto-light',
        url='https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        subdomains=['a', 'b', 'c', 'd'],
        max_zoom=20,
        label_overlay_url='https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png',
        label_overlay_subdomains=['a', 'b', 'c', 'd'],
        label_overlay_zoom_offset=-1,
    ),

    'carto-light-nolabels': TileLayerConfig(
        tile_id='carto-light-nolabels',
        url='https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png',
        subdomains=['a', 'b', 'c', 'd'],
        max_zoom=20,
    ),

    'osm-standard': TileLayerConfig(
        tile_id='osm-standard',
        url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains=['a', 'b', 'c'],
        max_zoom=19,
        retina=False,
        zoom_offset=-1,
    ),

    'osm-hot': TileLayerConfig(
        tile_id='osm-hot',
        url='https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png',
        subdomains=['a', 'b'],
        max_zoom=19,
        retina=False,
        zoom_offset=-1,
    ),

    'wikimedia': TileLayerConfig(
        tile_id='wikimedia',
        url='https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png',
        subdomains=[],
        max_zoom=19,
        retina=False,
        zoom_offset=-1,
    ),

}

DEFAULT_TILE_LAYER_ID = 'carto-voyager'


def get_tile_config(tile_layer_id: Optional[str] = None) -> TileLayerConfig:
    """Get tile layer config by ID, falling back to default."""
    if tile_layer_id and tile_layer_id in TILE_LAYERS:
        return TILE_LAYERS[tile_layer_id]
    return TILE_LAYERS[DEFAULT_TILE_LAYER_ID]
