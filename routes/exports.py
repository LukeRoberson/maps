"""
Export routes.
"""

from flask import Blueprint, request, jsonify, send_file
from typing import Dict, Any

from backend import ExportService
from backend.config import Config

exports_bp = Blueprint('exports', __name__, url_prefix='/api/exports')

config = Config
export_service = ExportService(config.EXPORT_FOLDER)


@exports_bp.route('', methods=['POST'])
def export_map() -> Dict[str, Any]:
    """
    Export a map as PNG.
    
    Returns:
        Dict[str, Any]: JSON response with export result
    """
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['map_area_id', 'image_data']
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {'error': f'Missing required field: {field}'}
                ), 400
        
        result = export_service.export_map(
            map_id=data['map_area_id'],
            image_data=data['image_data'],
            filename=data.get('filename')
        )
        
        if result['success']:
            return jsonify({
                'filename': result['filename'],
                'size': result['size']
            }), 201
        else:
            return jsonify({'error': result['error']}), 500
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@exports_bp.route('/<filename>', methods=['GET'])
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
            return jsonify({'error': 'File not found'}), 404
        
        return send_file(
            filepath,
            mimetype='image/png',
            as_attachment=True,
            download_name=filename
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
