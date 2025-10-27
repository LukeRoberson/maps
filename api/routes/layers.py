"""
Module: routes/layers.py

API endpoints for managing layers.

Blueprint: layers_bp

Routes:
    list_layers
        List all layers for a map area
        /api/layers [GET]
    create_layer
        Create a new layer
        /api/layers [POST]
    get_layer
        Get a layer by ID
        /api/layers/<int:layer_id> [GET]
    update_layer
        Update a layer
        /api/layers/<int:layer_id> [PUT]
    delete_layer
        Delete a layer
        /api/layers/<int:layer_id> [DELETE]

Third Party Imports
    flask:
        Blueprint - Blueprint for route grouping
        Response - Response object for HTTP responses
        request - Request object for accessing request data
        jsonify - Function to create JSON responses
        make_response - Function to create custom HTTP responses

Local Imports
    backend:
        LayerModel - Data model for layers
        LayerService - Service layer for layer operations
"""


# Standard Library Imports
from typing import (
    Tuple,
    Union
)

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
    LayerModel,
    LayerService
)


# Blueprint
layers_bp = Blueprint(
    'layers',
    __name__,
    url_prefix='/api/layers'
)


@layers_bp.route(
    '',
    methods=['GET']
)
def list_layers() -> Union[Response, Tuple[Response, int]]:
    """
    List layers for a map area.

    Returns:
        Dict[str, Any]: JSON response with layer list
    """

    try:
        layer_service = LayerService()

        # Get map_id from query parameters
        map_id = request.args.get('map_area_id', type=int)
        if not map_id:
            return make_response(
                jsonify(
                    {'error': 'map_area_id parameter required'}
                ), 400
            )

        # Fetch layers
        layers = layer_service.read(map_id=map_id)
        return make_response(
            jsonify(
                {
                    'layers': [layer.to_dict() for layer in layers]
                }
            ), 200
        )

    except Exception as e:
        return make_response(
            jsonify(
                {'error': str(e)}
            ),
            500
        )


@layers_bp.route(
    '',
    methods=['POST']
)
def create_layer() -> Union[Response, Tuple[Response, int]]:
    """
    Create a new layer.

    Returns:
        Dict[str, Any]: JSON response with created layer
    """

    try:
        layer_service = LayerService()

        # Get JSON data from request
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
            'name',
            'layer_type'
        ]
        for field in required_fields:
            if field not in data:
                return make_response(
                    jsonify(
                        {'error': f'Missing required field: {field}'}
                    ),
                    400
                )

        # Validate and sanitize config field
        config = {}
        if 'config' in data and isinstance(data['config'], dict):
            # Only allow specific whitelisted fields
            allowed_config_fields = {'color'}
            for key in data['config']:
                if key in allowed_config_fields:
                    # Validate color field format
                    if key == 'color':
                        color_value = data['config'][key]
                        if isinstance(color_value, str) and \
                           len(color_value) <= 20 and \
                           color_value.startswith('#'):
                            config[key] = color_value

        # Create LayerModel instance
        layer = LayerModel(
            map_area_id=data['map_area_id'],
            name=data['name'],
            layer_type=data['layer_type'],
            visible=data.get('visible', True),
            z_index=data.get('z_index', 0),
            config=config
        )

        # Create layer via service
        created_layer = layer_service.create(layer=layer)
        return make_response(
            jsonify(
                created_layer.to_dict()
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


@layers_bp.route(
    '/<int:layer_id>',
    methods=['GET']
)
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

    try:
        # Read layer via service
        layer_service = LayerService()
        layer = layer_service.read(layer_id=layer_id)

        # Check if layer exists
        if not layer:
            return make_response(
                jsonify(
                    {'error': 'Layer not found'}
                ),
                404
            )

        # Return layer details
        return make_response(
            jsonify(
                layer.to_dict()
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


@layers_bp.route(
    '/<int:layer_id>',
    methods=['PUT']
)
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

    try:
        layer_service = LayerService()

        # Get JSON data from request
        data = request.get_json()
        if not data:
            return make_response(
                jsonify(
                    {'error': 'No data provided'}
                ),
                400
            )

        # Validate and sanitize config field if present
        if 'config' in data:
            if not isinstance(data['config'], dict):
                return make_response(
                    jsonify(
                        {'error': 'config must be an object'}
                    ),
                    400
                )
            
            # Only allow specific whitelisted fields
            sanitized_config = {}
            allowed_config_fields = {'color'}
            for key in data['config']:
                if key in allowed_config_fields:
                    # Validate color field format
                    if key == 'color':
                        color_value = data['config'][key]
                        if isinstance(color_value, str) and \
                           len(color_value) <= 20 and \
                           color_value.startswith('#'):
                            sanitized_config[key] = color_value
                        else:
                            return make_response(
                                jsonify(
                                    {
                                        'error': (
                                            'color must be a hex '
                                            'color string'
                                        )
                                    }
                                ),
                                400
                            )
            data['config'] = sanitized_config

        # Update layer via service
        updated_layer = layer_service.update(
            layer_id=layer_id,
            updates=data
        )

        # Check if layer exists
        if not updated_layer:
            return make_response(
                jsonify(
                    {'error': 'Layer not found'}
                ),
                404
            )

        # Return updated layer details
        return make_response(
            jsonify(
                updated_layer.to_dict()
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


@layers_bp.route(
    '/<int:layer_id>',
    methods=['DELETE']
)
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

    try:
        # Delete layer via service
        layer_service = LayerService()
        success = layer_service.delete(layer_id)

        # Validate the result
        if not success:
            return make_response(
                jsonify(
                    {'error': 'Layer not found'}
                ), 404
            )

        # Return success message
        return make_response(
            jsonify(
                {'message': 'Layer deleted successfully'}
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
