"""
module: exports.py

API endpoints for exporting maps to PNG files.

Blueprint: exports_bp

Routes:
    generate_export
        Generate a server-side PNG export of a map area
        /api/exports/generate [POST]
    download_export
        Download a previously generated export file
        /api/exports/<filename> [GET]

Third Party Imports
    flask:
        Blueprint - Blueprint for route grouping
        Response - Response object for HTTP responses
        request - Request object for accessing request data
        jsonify - Function to create JSON responses
        send_file - Function to send files as responses
        make_response - Function to create custom HTTP responses

Local Imports
    backend:
        ExportService - Service layer for export operations
    backend.config:
        Config - Configuration settings
"""


# Standard Library Imports
import io
import logging
from typing import Any

# Third Party Imports
from flask import (
    Blueprint,
    Response,
    request,
    jsonify,
    send_file,
    make_response
)

# Local Imports
from backend import ExportService
from backend.config import Config


# Blueprint
exports_bp = Blueprint(
    'exports',
    __name__,
    url_prefix='/api/exports'
)

# Get the config
config = Config

# Initialize the export service
export_service = ExportService(config.EXPORT_FOLDER)

# Initialize logger
logger = logging.getLogger(__name__)


@exports_bp.route(
    '/generate',
    methods=['POST']
)
def generate_export() -> Response:
    """
    Generate a server-side PNG export of a map area.

    Request JSON:
        map_area_id (int): Required. The map area to export.
        zoom (int|null): Optional. Zoom level override (null = auto).
        include_annotations (bool): Whether to draw annotations (default True).
        include_boundary (bool): Whether to draw boundary outline (default True).

    Returns:
        Response: PNG file as binary download
    """

    try:
        data = request.get_json()

        if not data:
            return make_response(
                jsonify({'error': 'No data provided'}),
                400
            )

        map_area_id = data.get('map_area_id')
        if not map_area_id:
            return make_response(
                jsonify({'error': 'Missing required field: map_area_id'}),
                400
            )

        zoom = data.get('zoom')  # None = auto
        include_annotations = data.get('include_annotations', True)
        include_boundary = data.get('include_boundary', True)
        tile_layer = data.get('tile_layer')  # None = use map area's saved value
        raw_multiplier = data.get('line_width_multiplier', 1.0)
        try:
            line_width_multiplier = float(raw_multiplier)
            if not (0.1 <= line_width_multiplier <= 10):
                line_width_multiplier = 1.0
        except (TypeError, ValueError):
            line_width_multiplier = 1.0

        png_bytes, filename = export_service.generate(
            map_area_id=int(map_area_id),
            zoom=int(zoom) if zoom is not None else None,
            include_annotations=bool(include_annotations),
            include_boundary=bool(include_boundary),
            tile_layer=str(tile_layer) if tile_layer is not None else None,
            line_width_multiplier=line_width_multiplier,
        )

        return send_file(
            io.BytesIO(png_bytes),
            mimetype='image/png',
            as_attachment=True,
            download_name=filename,
        )

    except ValueError as e:
        logger.warning("Export validation error: %s", e)
        return make_response(
            jsonify({'error': str(e)}),
            400
        )
    except Exception as e:
        logger.error("Export generation failed: %s", e, exc_info=True)
        return make_response(
            jsonify({'error': 'Export failed. Please try again.'}),
            500
        )


@exports_bp.route(
    '/<filename>',
    methods=['GET']
)
def download_export(
    filename: str
) -> Any:
    """
    Download an exported map file.

    Args:
        filename (str): Export filename

    Returns:
        Any: File download response
    """

    try:
        filepath = export_service.get_export_path(filename)

        if not filepath:
            return make_response(
                jsonify({'error': 'File not found'}),
                404
            )

        return send_file(
            filepath,
            mimetype='image/png',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return make_response(
            jsonify({'error': str(e)}),
            500
        )
