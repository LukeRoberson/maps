"""
Project routes.
"""

from flask import Blueprint, request, jsonify, current_app
from typing import Dict, Any

from backend import ProjectModel
from services import ProjectService

projects_bp = Blueprint('projects', __name__, url_prefix='/api/projects')


@projects_bp.route('', methods=['GET'])
def list_projects() -> Dict[str, Any]:
    """
    List all projects.
    
    Returns:
        Dict[str, Any]: JSON response with project list
    """
    project_service = ProjectService()
    try:
        projects = project_service.list_projects()
        return jsonify({
            'projects': [p.to_dict() for p in projects]
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('', methods=['POST'])
def create_project() -> Dict[str, Any]:
    """
    Create a new project.
    
    Returns:
        Dict[str, Any]: JSON response with created project
    """
    project_service = ProjectService()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['name', 'center_lat', 'center_lon']
        for field in required_fields:
            if field not in data:
                return jsonify(
                    {'error': f'Missing required field: {field}'}
                ), 400
        
        project = ProjectModel(
            name=data['name'],
            description=data.get('description', ''),
            center_lat=float(data['center_lat']),
            center_lon=float(data['center_lon']),
            zoom_level=int(data.get('zoom_level', 13))
        )
        
        created_project = project_service.create_project(project)
        return jsonify(created_project.to_dict()), 201
    
    except ValueError as e:
        return jsonify({'error': f'Invalid data: {str(e)}'}), 400
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/<int:project_id>', methods=['GET'])
def get_project(
    project_id: int
) -> Dict[str, Any]:
    """
    Get a project by ID.
    
    Args:
        project_id (int): Project ID
    
    Returns:
        Dict[str, Any]: JSON response with project details
    """
    project_service = ProjectService()
    try:
        project = project_service.get_project(project_id)
        
        if not project:
            return jsonify({'error': 'Project not found'}), 404
        
        return jsonify(project.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/<int:project_id>', methods=['PUT'])
def update_project(
    project_id: int
) -> Dict[str, Any]:
    """
    Update a project.
    
    Args:
        project_id (int): Project ID
    
    Returns:
        Dict[str, Any]: JSON response with updated project
    """
    project_service = ProjectService()
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        updated_project = project_service.update_project(
            project_id,
            data
        )
        
        if not updated_project:
            return jsonify({'error': 'Project not found'}), 404
        
        return jsonify(updated_project.to_dict())
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@projects_bp.route('/<int:project_id>', methods=['DELETE'])
def delete_project(
    project_id: int
) -> Dict[str, Any]:
    """
    Delete a project.
    
    Args:
        project_id (int): Project ID
    
    Returns:
        Dict[str, Any]: JSON response confirming deletion
    """
    project_service = ProjectService()
    try:
        success = project_service.delete_project(project_id)
        
        if not success:
            return jsonify({'error': 'Project not found'}), 404
        
        return jsonify({'message': 'Project deleted successfully'})
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500
