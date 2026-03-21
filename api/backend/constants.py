"""
Module: backend.constants

Shared constants for the backend application.

Centralises magic numbers and default values so they can be adjusted in one
place.  Each section documents what the constant controls and how changing it
affects behaviour.
"""


# ---------------------------------------------------------------------------
# Annotation validation limits
# ---------------------------------------------------------------------------

# Maximum line weight (pixels) accepted for an annotation style.
# Raising this allows users to draw thicker lines.
ANNOTATION_MAX_WEIGHT: int = 50

# Font-size range (px) accepted for text annotations.
# The lower bound prevents illegibly tiny text; the upper bound avoids
# excessively large labels that dominate the map.
ANNOTATION_MIN_FONT_SIZE: int = 6
ANNOTATION_MAX_FONT_SIZE: int = 96

# Maximum length of a colour string (e.g. '#ff00ff').
# Hex colours are at most 7 characters; this allows some headroom.
MAX_COLOR_STRING_LENGTH: int = 20

# Maximum length of a CSS dashArray string (e.g. '5 10 5').
MAX_DASH_ARRAY_LENGTH: int = 50


# ---------------------------------------------------------------------------
# Layer validation limits
# ---------------------------------------------------------------------------

# Line-thickness range accepted when creating or editing a layer.
# Values outside this range are rejected by the API.
LAYER_MIN_LINE_THICKNESS: float = 1
LAYER_MAX_LINE_THICKNESS: float = 20


# ---------------------------------------------------------------------------
# Boundary validation
# ---------------------------------------------------------------------------

# Minimum number of coordinate pairs required to form a valid boundary polygon.
# Three points define the simplest polygon (a triangle).
BOUNDARY_MIN_COORDINATES: int = 3


# ---------------------------------------------------------------------------
# Default colours (server-side)
# ---------------------------------------------------------------------------

# Default colour assigned to newly-created boundary layers.
# Change this to alter the colour a boundary layer receives when first created
# via the API if no colour is explicitly provided.
DEFAULT_BOUNDARY_LAYER_COLOR: str = '#e74c3c'


# ---------------------------------------------------------------------------
# Export engine
# ---------------------------------------------------------------------------

# Standard Web Mercator tile size in pixels.
TILE_PX: int = 256

# Maximum output image dimension (pixels per axis).
# Limits memory usage and prevents excessively large exports.
# Increase if users need ultra-high-resolution exports.
MAX_IMAGE_PX: int = 8000

# Fractional padding added around the boundary bounding box when exporting.
# 0.05 = 5% padding on each side.  Increase for more breathing room.
BBOX_PADDING: float = 0.05

# HTTP timeout (seconds) for individual tile-fetch requests during export.
EXPORT_TILE_FETCH_TIMEOUT: int = 10

# Number of concurrent threads used to download tiles during export.
# Higher values speed up exports but increase load on tile servers.
EXPORT_TILE_FETCH_WORKERS: int = 8

# Maximum number of retries when a tile server responds with 429 (rate-limit).
EXPORT_TILE_RETRY_MAX: int = 4

# Base delay (seconds) for exponential back-off on 429 responses.
# Actual delay doubles with each successive retry.
EXPORT_TILE_RETRY_BASE_DELAY: float = 1.0


# ---------------------------------------------------------------------------
# Tile proxy (routes/tiles.py)
# ---------------------------------------------------------------------------

# HTTP timeout (seconds) for fetching a single Wikimedia tile.
TILE_PROXY_FETCH_TIMEOUT: int = 10

# Browser cache duration (seconds) for proxied tiles.
# 86400 = 24 hours.  Tiles change infrequently, so this is usually fine.
TILE_PROXY_CACHE_MAX_AGE: int = 86400

# Accepted zoom-level range for the tile proxy endpoint.
TILE_PROXY_MIN_ZOOM: int = 0
TILE_PROXY_MAX_ZOOM: int = 19


# ---------------------------------------------------------------------------
# Project defaults
# ---------------------------------------------------------------------------

# Default zoom level assigned to newly-created projects.
DEFAULT_PROJECT_ZOOM: float = 13
