"""
Module: routes/boundaries.py

API endpoints for managing boundaries.

Blueprint: boundaries_bp

Routes:
    create_boundary
        Create a new boundary
        /api/boundaries [POST]
    get_boundary_by_map_area
        Get boundary for a map area
        /api/boundaries/map-area/<int:map_area_id> [GET]
    update_boundary
        Update a boundary's coordinates
        /api/boundaries/<int:boundary_id> [PUT]
    delete_boundary
        Delete a boundary
        /api/boundaries/<int:boundary_id> [DELETE]

Third Party Imports
    flask:
        Blueprint - Blueprint for route grouping
        Response - Response object for HTTP responses
        request - Request object for accessing request data
        jsonify - Function to create JSON responses
        make_response - Function to create custom HTTP responses

Local Imports
    backend:
        MapService - Service layer for map operations
        BoundaryModel - Data model for boundaries
        BoundaryService - Service layer for boundary operations
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
    MapService,
    BoundaryModel,
    BoundaryService
)


# Blueprint
boundaries_bp = Blueprint(
    'boundaries',
    __name__,
    url_prefix='/api/boundaries'
)


@boundaries_bp.route(
    '',
    methods=['POST']
)
def create_boundary() -> Response:
    """
    Create a new boundary.

    Returns:
        Response: JSON response with created boundary
    """

    try:
        boundary_service = BoundaryService()
        map_service = MapService()

        # Get data from request
        data = request.get_json()
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
            'coordinates'
        ]
        for field in required_fields:
            if field not in data:
                return make_response(
                    jsonify(
                        {'error': f'Missing required field: {field}'}
                    ),
                    400
                )

        # Get the map area to check if it has a parent
        map_area = map_service.read(map_id=data['map_area_id'])
        if not map_area:
            return make_response(
                jsonify(
                    {'error': 'Map area not found'}
                ),
                404
            )

        # If map area has a parent, validate boundary is within parent
        if map_area.parent_id:
            # Get parent boundary
            parent_boundary = boundary_service.read(
                map_id=map_area.parent_id
            )

            # Validate new boundary is within parent boundary
            if parent_boundary:
                # Check if coordinates are within parent boundary
                is_valid = boundary_service.is_within_boundary(
                    coordinates=data['coordinates'],
                    parent_boundary=parent_boundary.coordinates
                )

                # If not valid, return error
                if not is_valid:
                    # Determine map types
                    map_type = (
                        'Individual map' if map_area.area_type == 'individual'
                        else 'Suburb'
                    )
                    parent_type = (
                        'suburb' if map_area.area_type == 'individual'
                        else 'master map'
                    )

                    return make_response(
                        jsonify(
                            {
                                'error': (
                                        f'{map_type} boundary must be '
                                        f'completely within the {parent_type} '
                                        f'boundary'
                                    )
                            }
                        ),
                        400
                    )

        # Create boundary model
        boundary = BoundaryModel(
            map_id=data['map_area_id'],
            coordinates=data['coordinates']
        )

        # Create boundary
        created_boundary = boundary_service.create(boundary)

        # Return created boundary
        return make_response(
            jsonify(
                created_boundary.to_dict()
            ),
            201
        )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
            500
        )


@boundaries_bp.route(
    '/map-area/<int:map_area_id>',
    methods=['GET']
)
def get_boundary_by_map_area(
    map_area_id: int
) -> Response:
    """
    Get boundary for a map area.

    Args:
        map_area_id (int): Map area ID

    Returns:
        Response: JSON response with boundary details
    """

    try:
        # Read boundary
        boundary_service = BoundaryService()
        boundary = boundary_service.read(map_id=map_area_id)

        # If not found, return 404
        if not boundary:
            return make_response(
                jsonify(
                    {'error': 'Boundary not found'}
                ),
                404
            )

        # Return boundary
        return make_response(
            jsonify(
                boundary.to_dict()
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


@boundaries_bp.route(
    '/<int:boundary_id>',
    methods=['PUT']
)
def update_boundary(
    boundary_id: int
) -> Response:
    """
    Update a boundary's coordinates.

    Args:
        boundary_id (int): Boundary ID

    Returns:
        Response: JSON response with updated boundary
    """

    try:
        boundary_service = BoundaryService()

        # Get data from request
        data = request.get_json()
        if not data or 'coordinates' not in data:
            return make_response(
                jsonify(
                    {'error': 'coordinates field required'}
                ),
                400
            )

        # Update boundary
        updated_boundary = boundary_service.update(
            boundary_id,
            data['coordinates']
        )

        # Validate update
        if not updated_boundary:
            return make_response(
                jsonify(
                    {'error': 'Boundary not found'}
                ),
                404
            )

        # Return updated boundary
        return make_response(
            jsonify(
                updated_boundary.to_dict()
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


@boundaries_bp.route(
    '/<int:boundary_id>',
    methods=['DELETE']
)
def delete_boundary(
    boundary_id: int
) -> Response:
    """
    Delete a boundary.

    Args:
        boundary_id (int): Boundary ID

    Returns:
        Response: JSON response confirming deletion
    """

    try:
        # Delete boundary
        boundary_service = BoundaryService()
        success = boundary_service.delete(boundary_id)

        # Validate deletion
        if not success:
            return make_response(
                jsonify(
                    {'error': 'Boundary not found'}
                ),
                404
            )

        # Return success message
        return make_response(
            jsonify(
                {'message': 'Boundary deleted successfully'}
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
