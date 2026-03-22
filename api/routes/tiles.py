"""
Route: /api/tiles/wikimedia

Proxy for Wikimedia map tiles.

Wikimedia's tile servers restrict tile access based on the browser
Referer header, blocking requests from non-Wikimedia, non-localhost origins.
This proxy fetches tiles server-side so the browser Referer restriction
does not apply.
"""

import logging

import requests
from flask import Blueprint, Response

from backend.constants import (
    TILE_PROXY_FETCH_TIMEOUT,
    TILE_PROXY_CACHE_MAX_AGE,
    TILE_PROXY_MIN_ZOOM,
    TILE_PROXY_MAX_ZOOM,
)

logger = logging.getLogger(__name__)

tiles_bp = Blueprint('tiles', __name__)

_WIKIMEDIA_TILE_URL = 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png'
_TILE_FETCH_TIMEOUT = TILE_PROXY_FETCH_TIMEOUT
# Tiles change infrequently; cache for 24 hours in the browser
_TILE_CACHE_MAX_AGE = TILE_PROXY_CACHE_MAX_AGE


@tiles_bp.route('/api/tiles/wikimedia/<int:z>/<int:x>/<int:y>')
def proxy_wikimedia_tile(z: int, x: int, y: int) -> Response:
    """
    Proxy a single Wikimedia map tile.

    Args:
        z: Zoom level (0-19)
        x: Tile X coordinate
        y: Tile Y coordinate

    Returns:
        Response: PNG tile image forwarded from Wikimedia,
            or an error response.
    """
    if not (TILE_PROXY_MIN_ZOOM <= z <= TILE_PROXY_MAX_ZOOM):
        return Response('Invalid zoom level', status=400)

    max_tile = 2 ** z
    if not (0 <= x < max_tile and 0 <= y < max_tile):
        return Response('Invalid tile coordinates', status=400)

    url = _WIKIMEDIA_TILE_URL.format(z=z, x=x, y=y)

    try:
        upstream = requests.get(
            url,
            headers={
                'User-Agent': 'Mozilla/5.0 (compatible; maps-app/1.0)',
                'Referer': 'http://localhost/',
            },
            timeout=_TILE_FETCH_TIMEOUT,
        )
    except requests.RequestException as exc:
        logger.error(
            'Wikimedia tile fetch failed (%d/%d/%d): %s', z, x, y, exc,
            exc_info=True
        )
        return Response('Tile fetch failed', status=502)

    if upstream.status_code != 200:
        return Response('Tile unavailable', status=upstream.status_code)

    return Response(
        upstream.content,
        status=200,
        headers={
            'Content-Type': 'image/png',
            'Cache-Control': f'public, max-age={_TILE_CACHE_MAX_AGE}',
        },
    )
