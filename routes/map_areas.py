"""
Map area routes.
"""

from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any

from models import MapArea
from services import MapAreaService

map_areas_bp = Blueprint('map_areas', __name__, url_prefix='/api/map-areas')


@map_areas_bp.route('', methods=['GET'])
def list_map_areas() -> Dict[str, Any]:
    """
    List map areas for a project.
    
    Returns:
        Dict[str, Any]: JSON response with map area list
    """
    map_area_service = MapAreaService()
    try:
        project_id = request.args.get('project_id', type=int)
        
        if not project_id:
            return jsonify(
                {'error': 'project_id parameter required'}
            ), 400
        
        parent_id = request.args.get('parent_id', type=int)
        
        map_areas = map_area_service.list_map_areas(
            project_id,
            parent_id
        )
        
        return jsonify({
            'map_areas': [ma.to_dict() for ma in map_areas]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@map_areas_bp.route('/hierarchy', methods=['GET'])
def get_hierarchy() -> Dict[str, Any]:
    """
    Get hierarchical structure of map areas.
    
    Returns:
        Dict[str, Any]: JSON response with hierarchy
    """
    map_area_service = MapAreaService()
    try:
        project_id = request.args.get('project_id', type=int)
        
        if not project_id:
            return jsonify(
                {'error': 'project_id parameter required'}
            ), 400
        
        hierarchy = map_area_service.get_hierarchy(project_id)
        return jsonify(hierarchy)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@map_areas_bp.route('', methods=['POST'])
def create_map_area() -> Dict[str, Any]:
    """
    Create a new map area.
    
    Returns:
        Dict[str, Any]: JSON response with created map area
    """
    map_area_service = MapAreaService()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['project_id', 'name', 'area_type']
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {'error': f'Missing required field: {field}'}
                ), 400
        
        map_area = MapArea(
            project_id=data['project_id'],
            name=data['name'],
            area_type=data['area_type'],
            parent_id=data.get('parent_id'),
            boundary_id=data.get('boundary_id')
        )
        
        created_map_area = map_area_service.create_map_area(map_area)
        return jsonify(created_map_area.to_dict()), 201
    
    except ValueError as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@map_areas_bp.route('/<int:map_area_id>', methods=['GET'])
def get_map_area(
    map_area_id: int
) -> Dict[str, Any]:
    """
    Get a map area by ID.
    
    Args:
        map_area_id (int): Map area ID
    
    Returns:
        Dict[str, Any]: JSON response with map area details
    """
    map_area_service = MapAreaService()
    try:
        map_area = map_area_service.get_map_area(map_area_id)
        
        if not map_area:
            return jsonify({'error': 'Map area not found'}), 404
        
        return jsonify(map_area.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@map_areas_bp.route('/<int:map_area_id>', methods=['PUT'])
def update_map_area(
    map_area_id: int
) -> Dict[str, Any]:
    """
    Update a map area.
    
    Args:
        map_area_id (int): Map area ID
    
    Returns:
        Dict[str, Any]: JSON response with updated map area
    """
    map_area_service = MapAreaService()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        updated_map_area = map_area_service.update_map_area(
            map_area_id,
            data
        )
        
        if not updated_map_area:
            return jsonify({'error': 'Map area not found'}), 404
        
        return jsonify(updated_map_area.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@map_areas_bp.route('/<int:map_area_id>', methods=['DELETE'])
def delete_map_area(
    map_area_id: int
) -> Dict[str, Any]:
    """
    Delete a map area.
    
    Args:
        map_area_id (int): Map area ID
    
    Returns:
        Dict[str, Any]: JSON response confirming deletion
    """
    map_area_service = MapAreaService()
    try:
        success = map_area_service.delete_map_area(map_area_id)
        
        if not success:
            return jsonify({'error': 'Map area not found'}), 404
        
        return jsonify({'message': 'Map area deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
