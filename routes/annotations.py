"""
Annotation routes.
"""

from flask import Blueprint, request, jsonify
from typing import Dict, Any

from models import Annotation
from services import AnnotationService

annotations_bp = Blueprint(
    'annotations',
    __name__,
    url_prefix='/api/annotations'
)
annotation_service = AnnotationService()


@annotations_bp.route('', methods=['GET'])
def list_annotations() -> Dict[str, Any]:
    """
    List annotations for a layer.
    
    Returns:
        Dict[str, Any]: JSON response with annotation list
    """
    
    try:
        layer_id = request.args.get('layer_id', type=int)
        
        if not layer_id:
            return jsonify(
                {'error': 'layer_id parameter required'}
            ), 400
        
        annotations = annotation_service.list_annotations(layer_id)
        return jsonify({
            'annotations': [ann.to_dict() for ann in annotations]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@annotations_bp.route('', methods=['POST'])
def create_annotation() -> Dict[str, Any]:
    """
    Create a new annotation.
    
    Returns:
        Dict[str, Any]: JSON response with created annotation
    """
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['layer_id', 'annotation_type', 'coordinates']
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {'error': f'Missing required field: {field}'}
                ), 400
        
        annotation = Annotation(
            layer_id=data['layer_id'],
            annotation_type=data['annotation_type'],
            coordinates=data['coordinates'],
            style=data.get('style', {}),
            content=data.get('content')
        )
        
        created_annotation = annotation_service.create_annotation(
            annotation
        )
        return jsonify(created_annotation.to_dict()), 201
    
    except ValueError as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@annotations_bp.route('/<int:annotation_id>', methods=['GET'])
def get_annotation(
    annotation_id: int
) -> Dict[str, Any]:
    """
    Get an annotation by ID.
    
    Args:
        annotation_id (int): Annotation ID
    
    Returns:
        Dict[str, Any]: JSON response with annotation details
    """
    
    try:
        annotation = annotation_service.get_annotation(annotation_id)
        
        if not annotation:
            return jsonify({'error': 'Annotation not found'}), 404
        
        return jsonify(annotation.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@annotations_bp.route('/<int:annotation_id>', methods=['PUT'])
def update_annotation(
    annotation_id: int
) -> Dict[str, Any]:
    """
    Update an annotation.
    
    Args:
        annotation_id (int): Annotation ID
    
    Returns:
        Dict[str, Any]: JSON response with updated annotation
    """
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        updated_annotation = annotation_service.update_annotation(
            annotation_id,
            data
        )
        
        if not updated_annotation:
            return jsonify({'error': 'Annotation not found'}), 404
        
        return jsonify(updated_annotation.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@annotations_bp.route('/<int:annotation_id>', methods=['DELETE'])
def delete_annotation(
    annotation_id: int
) -> Dict[str, Any]:
    """
    Delete an annotation.
    
    Args:
        annotation_id (int): Annotation ID
    
    Returns:
        Dict[str, Any]: JSON response confirming deletion
    """
    
    try:
        success = annotation_service.delete_annotation(annotation_id)
        
        if not success:
            return jsonify({'error': 'Annotation not found'}), 404
        
        return jsonify({'message': 'Annotation deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
