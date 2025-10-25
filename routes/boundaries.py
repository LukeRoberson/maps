"""
Boundary routes.
"""

from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any

from backend import BoundaryModel, MapService, BoundaryService

boundaries_bp = Blueprint(
    'boundaries',
    __name__,
    url_prefix='/api/boundaries'
)


@boundaries_bp.route('/map-area/<int:map_area_id>', methods=['GET'])
def get_boundary_by_map_area(
    map_area_id: int
) -> Dict[str, Any]:
    """
    Get boundary for a map area.
    
    Args:
        map_area_id (int): Map area ID
    
    Returns:
        Dict[str, Any]: JSON response with boundary details
    """
    boundary_service = BoundaryService()
    try:
        boundary = boundary_service.read(map_area_id)
        
        if not boundary:
            return jsonify({'error': 'Boundary not found'}), 404
        
        return jsonify(boundary.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@boundaries_bp.route('', methods=['POST'])
def create_boundary() -> Dict[str, Any]:
    """
    Create a new boundary.
    
    Returns:
        Dict[str, Any]: JSON response with created boundary
    """
    boundary_service = BoundaryService()
    map_area_service = MapService()    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['map_area_id', 'coordinates']
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {'error': f'Missing required field: {field}'}
                ), 400
        
        # Get the map area to check if it has a parent
        map_area = map_area_service.read(data['map_area_id'])
        if not map_area:
            return jsonify({'error': 'Map area not found'}), 404
        
        # If map area has a parent, validate boundary is within parent
        if map_area.parent_id:
            parent_boundary = boundary_service.read(
                map_area.parent_id
            )
            
            if parent_boundary:
                is_valid = boundary_service.is_within_boundary(
                    data['coordinates'],
                    parent_boundary.coordinates
                )
                
                if not is_valid:
                    area_type = 'Individual map' if \
                        map_area.area_type == 'individual' else 'Suburb'
                    parent_type = 'suburb' if \
                        map_area.area_type == 'individual' else \
                        'master map'
                    
                    return jsonify({
                        'error': f'{area_type} boundary must be '
                                 f'completely within the {parent_type} '
                                 f'boundary'
                    }), 400
        
        boundary = BoundaryModel(
            map_area_id=data['map_area_id'],
            coordinates=data['coordinates']
        )
        
        created_boundary = boundary_service.create(boundary)
        return jsonify(created_boundary.to_dict()), 201
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@boundaries_bp.route('/<int:boundary_id>', methods=['PUT'])
def update_boundary(
    boundary_id: int
) -> Dict[str, Any]:
    """
    Update a boundary's coordinates.
    
    Args:
        boundary_id (int): Boundary ID
    
    Returns:
        Dict[str, Any]: JSON response with updated boundary
    """
    boundary_service = BoundaryService()
    try:
        data = request.get_json()
        
        if not data or 'coordinates' not in data:
            return jsonify(
                {'error': 'coordinates field required'}
            ), 400
        
        updated_boundary = boundary_service.update(
            boundary_id,
            data['coordinates']
        )
        
        if not updated_boundary:
            return jsonify({'error': 'Boundary not found'}), 404
        
        return jsonify(updated_boundary.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@boundaries_bp.route('/<int:boundary_id>', methods=['DELETE'])
def delete_boundary(
    boundary_id: int
) -> Dict[str, Any]:
    """
    Delete a boundary.
    
    Args:
        boundary_id (int): Boundary ID
    
    Returns:
        Dict[str, Any]: JSON response confirming deletion
    """
    boundary_service = BoundaryService()
    try:
        success = boundary_service.delete(boundary_id)
        
        if not success:
            return jsonify({'error': 'Boundary not found'}), 404
        
        return jsonify({'message': 'Boundary deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
