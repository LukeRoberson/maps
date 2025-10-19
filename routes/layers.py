"""
Layer routes.
"""

from flask import Blueprint, request, jsonify, current_app
from typing import Tuple, Union
from werkzeug.wrappers import Response

from models import Layer
from services import LayerService

layers_bp = Blueprint('layers', __name__, url_prefix='/api/layers')


@layers_bp.route('', methods=['GET'])
def list_layers() -> Union[Response, Tuple[Response, int]]:
    """
    List layers for a map area.
    
    Returns:
        Dict[str, Any]: JSON response with layer list
    """
    layer_service = LayerService()
    try:
        map_area_id = request.args.get('map_area_id', type=int)
        
        if not map_area_id:
            return jsonify(
                {'error': 'map_area_id parameter required'}
            ), 400
        
        layers = layer_service.list_layers_for_map_area(map_area_id)
        return jsonify({
            'layers': [layer.to_dict() for layer in layers]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@layers_bp.route('', methods=['POST'])
def create_layer() -> Union[Response, Tuple[Response, int]]:
    """
    Create a new layer.
    
    Returns:
        Dict[str, Any]: JSON response with created layer
    """
    layer_service = LayerService()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['map_area_id', 'name', 'layer_type']
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {'error': f'Missing required field: {field}'}
                ), 400
        
        layer = Layer(
            map_area_id=data['map_area_id'],
            name=data['name'],
            layer_type=data['layer_type'],
            visible=data.get('visible', True),
            z_index=data.get('z_index', 0),
            config=data.get('config', {})
        )
        
        created_layer = layer_service.create_layer(layer)
        return jsonify(created_layer.to_dict()), 201
    
    except ValueError as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@layers_bp.route('/<int:layer_id>', methods=['GET'])
def get_layer(
    layer_id: int
) -> Union[Response, Tuple[Response, int]]:
    """
    Get a layer by ID.
    
    Args:
        layer_id (int): Layer ID
    
    Returns:
        Dict[str, Any]: JSON response with layer details
    """
    layer_service = LayerService()
    try:
        layer = layer_service.get_layer(layer_id)
        
        if not layer:
            return jsonify({'error': 'Layer not found'}), 404
        
        return jsonify(layer.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@layers_bp.route('/<int:layer_id>', methods=['PUT'])
def update_layer(
    layer_id: int
) -> Union[Response, Tuple[Response, int]]:
    """
    Update a layer.
    
    Args:
        layer_id (int): Layer ID
    
    Returns:
        Dict[str, Any]: JSON response with updated layer
    """
    layer_service = LayerService()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        updated_layer = layer_service.update_layer(layer_id, data)
        
        if not updated_layer:
            return jsonify({'error': 'Layer not found'}), 404
        
        return jsonify(updated_layer.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@layers_bp.route('/<int:layer_id>', methods=['DELETE'])
def delete_layer(
    layer_id: int
) -> Union[Response, Tuple[Response, int]]:
    """
    Delete a layer.
    
    Args:
        layer_id (int): Layer ID
    
    Returns:
        Dict[str, Any]: JSON response confirming deletion
    """
    layer_service = LayerService()
    try:
        success = layer_service.delete_layer(layer_id)
        
        if not success:
            return jsonify({'error': 'Layer not found'}), 404
        
        return jsonify({'message': 'Layer deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
