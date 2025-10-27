"""
Module: routes/projects.py

API endpoints for managing projects.

Blueprint: projects_bp

Routes:
    list_projects
        List all projects
        /api/projects [GET]
    create_project
        Create a new project
        /api/projects [POST]
    get_project
        Get a project by ID
        /api/projects/<int:project_id> [GET]
    update_project
        Update a project
        /api/projects/<int:project_id> [PUT]
    delete_project
        Delete a project
        /api/projects/<int:project_id> [DELETE]

Third Party Imports
    flask:
        Blueprint - Blueprint for route grouping
        Response - Response object for type hinting
        request - Request object for accessing request data
        jsonify - Function to create JSON responses
        make_response - Function to create response objects

Local Imports
    backend:
        ProjectModel - Data model for projects
        ProjectService - Service layer for project operations
"""

# Third Party Imports
from flask import (
    Blueprint,
    Response,
    request,
    jsonify,
    make_response,
)

# Local Imports
from backend import (
    ProjectModel,
    ProjectService
)


# Blueprint
projects_bp = Blueprint(
    'projects',
    __name__,
    url_prefix='/api/projects'
)


@projects_bp.route(
    '',
    methods=['GET']
)
def list_projects() -> Response:
    """
    List all projects.

    Args:
        None

    Returns:
        Response: JSON response with project list
    """

    try:
        # Get a list of projects from the service
        project_service = ProjectService()
        projects = project_service.read()

        # Convert to a list of dictionaries, and return as JSON response
        return make_response(
            jsonify(
                {
                    'projects': [p.to_dict() for p in projects]
                }
            ),
            200
        )

    except Exception as e:
        return make_response(
            jsonify(
                {
                    'error': str(e)
                }
            ),
            500
        )


@projects_bp.route(
    '',
    methods=['POST']
)
def create_project() -> Response:
    """
    Create a new project.

    Contains JSON body with project details.
    {
        "name": "Project Name",
        "description": "Optional description" (optional),
        "center_lat": 37.7749,
        "center_lon": -122.4194,
        "zoom_level": 13 (optional, default 13)
    }

    Args:
        None

    Returns:
        Response: JSON response with created project
    """

    try:
        project_service = ProjectService()
        data = request.get_json()

        # The request body must contain project information
        if not data:
            return make_response(
                jsonify(
                    {'error': 'No data provided'}
                ),
                400
            )

        # Check that mandatory fields are present
        required_fields = [
            'name',
            'center_lat',
            'center_lon'
        ]
        for field in required_fields:
            if field not in data:
                return make_response(
                    jsonify(
                        {'error': f'Missing required field: {field}'}
                    ),
                    400
                )

        # Build into a ProjectModel data structure
        project = ProjectModel(
            name=data['name'],
            description=data.get('description', ''),
            center_lat=float(data['center_lat']),
            center_lon=float(data['center_lon']),
            zoom_level=int(data.get('zoom_level', 13))
        )

        # Create the project via the service
        created_project = project_service.create(project)
        return make_response(
            jsonify(
                created_project.to_dict()
            ),
            201
        )

    # Invalid values provided
    except ValueError as e:
        return make_response(
            jsonify(
                {'error': f'Invalid data: {str(e)}'}
            ),
            400
        )

    # Server side error
    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
            500
        )


@projects_bp.route(
    '/<int:project_id>',
    methods=['GET']
)
def get_project(
    project_id: int
) -> Response:
    """
    Get a project by ID.

    Args:
        project_id (int): Project ID

    Returns:
        Response: JSON response with project details
    """

    try:
        # Get the project from the service as a ProjectModel
        project_service = ProjectService()
        project = project_service.read(project_id)

        # If there is no result, return 404
        if not project:
            return make_response(
                jsonify(
                    {'error': 'Project not found'}
                ),
                404
            )

        # Return the project details as JSON
        return make_response(
            jsonify(
                project.to_dict()
            ),
            200
        )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ), 500
        )


@projects_bp.route(
    '/<int:project_id>',
    methods=['PUT']
)
def update_project(
    project_id: int
) -> Response:
    """
    Update a project.

    Args:
        project_id (int): Project ID

    Returns:
        Response: JSON response with updated project
    """

    try:
        project_service = ProjectService()
        data = request.get_json()

        # The request body must contain project information
        if not data:
            return make_response(
                jsonify(
                    {'error': 'No data provided'}
                ),
                400
            )

        # Update the project via the service
        updated_project = project_service.update(
            project_id,
            data
        )

        # If no project found to update, return 404
        if not updated_project:
            return make_response(
                jsonify(
                    {'error': 'Project not found'}
                ),
                404
            )

        # If successful, return the updated project details
        return make_response(
            jsonify(
                updated_project.to_dict()
            ),
            200
        )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
            500
        )


@projects_bp.route(
    '/<int:project_id>',
    methods=['DELETE']
)
def delete_project(
    project_id: int
) -> Response:
    """
    Delete a project.

    Args:
        project_id (int): Project ID

    Returns:
        Dict[str, Any]: JSON response confirming deletion
    """

    try:
        # Delete the project via the service
        project_service = ProjectService()
        success = project_service.delete(project_id)

        # If no project found to delete, return 404
        if not success:
            return make_response(
                jsonify(
                    {'error': 'Project not found'}
                ),
                404
            )

        # Return a success message
        return make_response(
            jsonify(
                {'message': 'Project deleted successfully'}
            ),
            200
        )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
            500
        )
