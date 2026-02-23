"""
Module: routes/map.py

API endpoints for managing maps.

Blueprint: map_areas_bp

routes:
    list_map_areas
        List all map areas
        /api/map_areas [GET]
    get_hierarchy
        Get hierarchical structure of map areas
        /api/map_areas/hierarchy [GET]
    create_map_area
        Create a new map area
        /api/map_areas [POST]
    get_map_area
        Get a map area by ID
        /api/map_areas/<int:map_area_id> [GET]
    update_map_area
        Update a map area
        /api/map_areas/<int:map_area_id> [PUT]
    delete_map_area
        Delete a map area
        /api/map_areas/<int:map_area_id> [DELETE]

Third Party Imports
    flask:
        Blueprint - Blueprint for route grouping
        Response - Response object for HTTP responses
        request - Request object for accessing request data
        jsonify - Function to create JSON responses
        make_response - Function to create custom HTTP responses

Local Imports
    backend:
        MapModel - Data model for maps
        MapService - Service layer for map operations
"""


# Third Party Imports
from flask import (
    Blueprint,
    Response,
    request,
    jsonify,
    make_response
)

# Local Imports
from backend import (
    MapModel,
    MapService
)


# Blueprint
map_areas_bp = Blueprint(
    'map_areas',
    __name__,
    url_prefix='/api/map-areas'
)


@map_areas_bp.route(
    '',
    methods=['GET']
)
def list_map_areas() -> Response:
    """
    List map areas for a project.

    Args:
        None

    Returns:
        Response: JSON response with map area list
    """

    try:
        map_service = MapService()

        # Get query parameters
        project_id = request.args.get(
            'project_id',
            type=int
        )
        parent_id = request.args.get(
            'parent_id',
            type=int
        )

        # Validate required parameter
        if not project_id:
            return make_response(
                jsonify(
                    {'error': 'project_id parameter required'}
                ),
                400
            )

        # Get a list of maps
        maps = map_service.read(
            project_id=project_id,
            parent_id=parent_id
        )

        return make_response(
            jsonify(
                {
                    'map_areas': [ma.to_dict() for ma in maps]
                }
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


@map_areas_bp.route(
    '/hierarchy',
    methods=['GET']
)
def get_hierarchy() -> Response:
    """
    Get hierarchical structure of map areas.

    Args:
        None

    Returns:
        Response: JSON response with hierarchy
    """

    try:
        map_area_service = MapService()

        # Get query parameters
        project_id = request.args.get(
            'project_id',
            type=int
        )

        # Validate required parameter
        if not project_id:
            return make_response(
                jsonify(
                    {'error': 'project_id parameter required'}
                ),
                400
            )

        # Get hierarchy
        hierarchy = map_area_service.read_hierarchy(project_id)
        return make_response(
            jsonify(
                hierarchy
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


@map_areas_bp.route(
    '',
    methods=['POST']
)
def create_map_area() -> Response:
    """
    Create a new map area.

    Args:
        None

    Returns:
        Response: JSON response with created map area
    """

    try:
        map_area_service = MapService()
        data = request.get_json()

        # Validate input data
        if not data:
            return make_response(
                jsonify(
                    {'error': 'No data provided'}
                ),
                400
            )

        # Check for required fields
        required_fields = [
            'project_id',
            'name',
            'area_type'
        ]

        # Validate required fields
        for field in required_fields:
            if field not in data:
                return make_response(
                    jsonify(
                        {'error': f'Missing required field: {field}'}
                    ),
                    400
                )

        # Create MapModel instance
        map_area = MapModel(
            project_id=data['project_id'],
            name=data['name'],
            area_type=data['area_type'],
            parent_id=data.get('parent_id'),
            boundary_id=data.get('boundary_id'),
            default_center_lat=data.get('default_center_lat'),
            default_center_lon=data.get('default_center_lon'),
            default_zoom=data.get('default_zoom'),
            default_bearing=data.get('default_bearing'),
            tile_layer=data.get('tile_layer')
        )

        # Create the map
        created_map = map_area_service.create(map_area)
        return make_response(
            jsonify(
                created_map.to_dict()
            ),
            201
        )

    except ValueError as e:
        return make_response(
            jsonify(
                {'error': f'Invalid data: {str(e)}'}
            ),
            400
        )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
            500
        )


@map_areas_bp.route(
    '/<int:map_area_id>',
    methods=['GET']
)
def get_map_area(
    map_area_id: int
) -> Response:
    """
    Get a map area by ID.

    Args:
        map_area_id (int): Map area ID

    Returns:
        Response: JSON response with map area details
    """

    try:
        # Get the map
        map_service = MapService()
        map_area = map_service.read(
            map_id=map_area_id
        )

        # Validate existence of the map
        if not map_area:
            return make_response(
                jsonify(
                    {'error': 'Map area not found'}
                ),
                404
            )

        # Return the map area details
        return make_response(
            jsonify(
                map_area.to_dict()
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


@map_areas_bp.route(
    '/<int:map_area_id>',
    methods=['PUT']
)
def update_map_area(
    map_area_id: int
) -> Response:
    """
    Update a map area.

    Args:
        map_area_id (int): Map area ID

    Returns:
        Response: JSON response with updated map area
    """

    try:
        map_area_service = MapService()

        # Get input data
        data = request.get_json()

        # Validate input data
        if not data:
            return make_response(
                jsonify(
                    {'error': 'No data provided'}
                ),
                400
            )

        # Update the map
        updated_map_area = map_area_service.update(
            map_area_id,
            data
        )

        # Validate returned map
        if not updated_map_area:
            return make_response(
                jsonify(
                    {'error': 'Map area not found'}
                ),
                404
            )

        # Return updated map area
        return make_response(
            jsonify(
                updated_map_area.to_dict()
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


@map_areas_bp.route(
    '/<int:map_area_id>',
    methods=['DELETE']
)
def delete_map_area(
    map_area_id: int
) -> Response:
    """
    Delete a map area.

    Args:
        map_area_id (int): Map area ID

    Returns:
        Response: JSON response confirming deletion
    """

    try:
        # Delete the map
        map_service = MapService()
        success = map_service.delete(map_area_id=map_area_id)

        # Validate deletion
        if not success:
            return make_response(
                jsonify(
                    {'error': 'Map area not found'}
                ),
                404
            )

        return make_response(
            jsonify(
                {'message': 'Map area deleted successfully'}
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
