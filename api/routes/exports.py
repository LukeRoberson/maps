"""
module: exports.py

API endpoints for exporting maps to PNG files.

Blueprint: exports_bp

Routes:
    export_map
        Export a map as PNG
        /api/exports [POST]
    download_export
        Download an exported map file
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
import logging
from typing import (Any)

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
    '',
    methods=['POST']
)
def export_map() -> Response:
    """
    Export a map as PNG.

    Args:
        None

    Returns:
        Response: JSON response with export result
    """

    try:
        # Get data from request
        data = request.get_json()

        # Validate input
        if not data:
            return make_response(
                jsonify(
                    {'error': 'No data provided'}
                ),
                400
            )

        # Validate required fields
        required_fields = [
            'map_area_id',
            'image_data'
        ]
        for field in required_fields:
            if field not in data:
                return make_response(
                    jsonify(
                        {'error': f'Missing required field: {field}'}
                    ),
                    400
                )

        # Call export service
        result = export_service.export_map(
            map_id=data['map_area_id'],
            image_data=data['image_data'],
            filename=data.get('filename')
        )

        # Return response
        if result['success']:
            return make_response(
                jsonify(
                    {
                        'filename': result['filename'],
                        'size': result['size']
                    }
                ),
                201
            )

        # Error occurred during export
        else:
            return make_response(
                jsonify(
                    {'error': result['error']}
                ),
                500
            )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
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
        # Get file path
        filepath = export_service.get_export_path(filename)

        # If file not found, return 404
        if not filepath:
            return make_response(
                jsonify(
                    {'error': 'File not found'}
                ),
                404
            )

        # Send file as response
        return send_file(
            filepath,
            mimetype='image/png',
            as_attachment=True,
            download_name=filename
        )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
            500
        )
