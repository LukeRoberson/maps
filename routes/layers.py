"""
Layer routes.
"""

from flask import Blueprint, request, jsonify
from typing import Dict, Any

from models import Layer
from services import LayerService

layers_bp = Blueprint('layers', __name__, url_prefix='/api/layers')
layer_service = LayerService()


@layers_bp.route('', methods=['GET'])
def list_layers() -> Dict[str, Any]:
    """
    List layers for a project.
    
    Returns:
        Dict[str, Any]: JSON response with layer list
    """
    
    try:
        project_id = request.args.get('project_id', type=int)
        
        if not project_id:
            return jsonify(
                {'error': 'project_id parameter required'}
            ), 400
        
        layers = layer_service.list_layers(project_id)
        return jsonify({
            'layers': [layer.to_dict() for layer in layers]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@layers_bp.route('', methods=['POST'])
def create_layer() -> Dict[str, Any]:
    """
    Create a new layer.
    
    Returns:
        Dict[str, Any]: JSON response with created layer
    """
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['project_id', 'name', 'layer_type']
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {'error': f'Missing required field: {field}'}
                ), 400
        
        layer = Layer(
            project_id=data['project_id'],
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
) -> Dict[str, Any]:
    """
    Get a layer by ID.
    
    Args:
        layer_id (int): Layer ID
    
    Returns:
        Dict[str, Any]: JSON response with layer details
    """
    
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
) -> Dict[str, Any]:
    """
    Update a layer.
    
    Args:
        layer_id (int): Layer ID
    
    Returns:
        Dict[str, Any]: JSON response with updated layer
    """
    
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
) -> Dict[str, Any]:
    """
    Delete a layer.
    
    Args:
        layer_id (int): Layer ID
    
    Returns:
        Dict[str, Any]: JSON response confirming deletion
    """
    
    try:
        success = layer_service.delete_layer(layer_id)
        
        if not success:
            return jsonify({'error': 'Layer not found'}), 404
        
        return jsonify({'message': 'Layer deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
