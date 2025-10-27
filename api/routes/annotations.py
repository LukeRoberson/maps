"""
Module: routes/annotations.py

API endpoints for managing annotations.

Blueprint: annotations_bp

Routes:
    list_annotations
        List annotations for a layer
        /api/annotations [GET]
    create_annotation
        Create a new annotation
        /api/annotations [POST]
    get_annotation
        Get an annotation by ID
        /api/annotations/<int:annotation_id> [GET]
    update_annotation
        Update an annotation
        /api/annotations/<int:annotation_id> [PUT]
    delete_annotation
        Delete an annotation
        /api/annotations/<int:annotation_id> [DELETE]

Third Party Imports
    flask:
        Blueprint - Blueprint for route grouping
        Response - Response object for HTTP responses
        request - Request object for accessing request data
        jsonify - Function to create JSON responses
        make_response - Function to create custom HTTP responses

Local Imports
    backend:
        AnnotationModel - Data model for annotations
        AnnotationService - Service layer for annotation operations
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
    AnnotationModel,
    AnnotationService
)


def validate_style(
    style_data: dict
) -> dict:
    """
    Validate and sanitize annotation style data.

    Args:
        style_data (dict): Raw style data from request

    Returns:
        dict: Sanitized style data with only allowed fields

    Raises:
        ValueError: If validation fails
    """

    if not isinstance(style_data, dict):
        raise ValueError('style must be an object')

    # Allowed Leaflet style properties
    allowed_fields = {
        'color',          # Line/stroke color
        'fillColor',      # Fill color for polygons
        'fillOpacity',    # Fill opacity (0-1)
        'weight',         # Line weight in pixels
        'opacity',        # Line opacity (0-1)
        'dashArray',      # Dash pattern
        'lineCap',        # Line cap style
        'lineJoin',       # Line join style
    }

    sanitized = {}

    for key, value in style_data.items():
        if key not in allowed_fields:
            continue

        # Validate color fields (hex format)
        if key in ('color', 'fillColor'):
            if not isinstance(value, str) or \
               len(value) > 20 or \
               not value.startswith('#'):
                raise ValueError(
                    f'{key} must be a hex color string'
                )
            sanitized[key] = value

        # Validate opacity fields (0-1)
        elif key in ('fillOpacity', 'opacity'):
            if not isinstance(value, (int, float)) or \
               value < 0 or \
               value > 1:
                raise ValueError(
                    f'{key} must be a number between 0 and 1'
                )
            sanitized[key] = float(value)

        # Validate weight (positive number, max 50)
        elif key == 'weight':
            if not isinstance(value, (int, float)) or \
               value < 0 or \
               value > 50:
                raise ValueError(
                    'weight must be a number between 0 and 50'
                )
            sanitized[key] = float(value)

        # Validate dashArray (string, max 50 chars)
        elif key == 'dashArray':
            if not isinstance(value, str) or len(value) > 50:
                raise ValueError(
                    'dashArray must be a string (max 50 chars)'
                )
            sanitized[key] = value

        # Validate lineCap and lineJoin (specific values)
        elif key == 'lineCap':
            if value not in ('butt', 'round', 'square'):
                raise ValueError(
                    "lineCap must be 'butt', 'round', or 'square'"
                )
            sanitized[key] = value

        elif key == 'lineJoin':
            if value not in ('miter', 'round', 'bevel'):
                raise ValueError(
                    "lineJoin must be 'miter', 'round', or 'bevel'"
                )
            sanitized[key] = value

    return sanitized


# Blueprint
annotations_bp = Blueprint(
    'annotations',
    __name__,
    url_prefix='/api/annotations'
)


@annotations_bp.route(
    '',
    methods=['GET']
)
def list_annotations() -> Response:
    """
    List annotations for a layer.

    Args:
        layer_id (int): Layer ID (query parameter)

    Returns:
        Response: JSON response with annotation list
    """

    try:
        annotation_service = AnnotationService()

        # Get layer_id from query parameters
        layer_id = request.args.get('layer_id', type=int)
        if not layer_id:
            return make_response(
                jsonify(
                    {'error': 'layer_id parameter required'}
                ),
                400
            )

        annotations = annotation_service.read(layer_id=layer_id)
        return make_response(
            jsonify(
                {
                    'annotations': [ann.to_dict() for ann in annotations]
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


@annotations_bp.route(
    '',
    methods=['POST']
)
def create_annotation() -> Response:
    """
    Create a new annotation.

    Returns:
        Response: JSON response with created annotation
    """

    try:
        annotation_service = AnnotationService()

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
            'layer_id',
            'annotation_type',
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

        # Validate and sanitize style field
        style = {}
        if 'style' in data:
            try:
                style = validate_style(data['style'])
            except ValueError as ve:
                return make_response(
                    jsonify(
                        {'error': f'Invalid style: {str(ve)}'}
                    ),
                    400
                )

        # Create AnnotationModel instance
        annotation = AnnotationModel(
            layer_id=data['layer_id'],
            annotation_type=data['annotation_type'],
            coordinates=data['coordinates'],
            style=style,
            content=data.get('content')
        )

        # Create annotation
        created_annotation = annotation_service.create(
            annotation
        )
        return make_response(
            jsonify(
                created_annotation.to_dict()
            ),
            201
        )

    except ValueError as e:
        return make_response(
            jsonify(
                {'error': str(e)}
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


@annotations_bp.route(
    '/<int:annotation_id>',
    methods=['GET']
)
def get_annotation(
    annotation_id: int
) -> Response:
    """
    Get an annotation by ID.

    Args:
        annotation_id (int): Annotation ID

    Returns:
        Response: JSON response with annotation details
    """

    try:
        annotation_service = AnnotationService()

        # Read annotation
        annotation = annotation_service.read(annotation_id=annotation_id)
        if not annotation:
            return make_response(
                jsonify(
                    {'error': 'Annotation not found'}
                ),
                404
            )

        return make_response(
            jsonify(
                annotation.to_dict()
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


@annotations_bp.route(
    '/<int:annotation_id>',
    methods=['PUT']
)
def update_annotation(
    annotation_id: int
) -> Response:
    """
    Update an annotation.

    Args:
        annotation_id (int): Annotation ID

    Returns:
        Response: JSON response with updated annotation
    """

    try:
        annotation_service = AnnotationService()

        # Get JSON data from request
        data = request.get_json()
        if not data:
            return make_response(
                jsonify(
                    {'error': 'No data provided'}
                ),
                400
            )

        # Validate and sanitize style field if present
        if 'style' in data:
            try:
                data['style'] = validate_style(data['style'])
            except ValueError as ve:
                return make_response(
                    jsonify(
                        {'error': f'Invalid style: {str(ve)}'}
                    ),
                    400
                )

        # Update annotation
        updated_annotation = annotation_service.update(
            annotation_id,
            data
        )

        # Verify update success
        if not updated_annotation:
            return make_response(
                jsonify(
                    {'error': 'Annotation not found'}
                ),
                404
            )

        # Return updated annotation
        return make_response(
            jsonify(
                updated_annotation.to_dict()
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


@annotations_bp.route(
    '/<int:annotation_id>',
    methods=['DELETE']
)
def delete_annotation(
    annotation_id: int
) -> Response:
    """
    Delete an annotation.

    Args:
        annotation_id (int): Annotation ID

    Returns:
        Response: JSON response confirming deletion
    """

    try:
        # Delete annotation
        annotation_service = AnnotationService()
        success = annotation_service.delete(annotation_id)

        # Verify deletion success
        if not success:
            return make_response(
                jsonify(
                    {'error': 'Annotation not found'}
                ),
                404
            )

        # Return success message
        return make_response(
            jsonify(
                {'message': 'Annotation deleted successfully'}
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
