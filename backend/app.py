"""
Backend API for Printable Maps Application.

Routes:
    /health:
        Health check endpoint.

Blueprints:
    - projects_bp:
        Blueprint for project-related routes.
    - map_areas_bp:
        Blueprint for map area-related routes.
    - boundaries_bp:
        Blueprint for boundary-related routes.
    - layers_bp:
        Blueprint for layer-related routes.
    - annotations_bp:
        Blueprint for annotation-related routes.
    - exports_bp:
        Blueprint for export-related routes.

Dependencies:
    - Flask
        Backend web framework.
    - Flask-CORS
        Allow frontend apps to access the API.

Custom Modules:
    - config
        Configuration management.
    - database
        Database connection and schema initialization.
    - routes
        API route blueprints for various resources.
"""

# Standard Library Imports
from flask_cors import CORS
from flask import (
    Flask,
    Response,
    jsonify,
)
import os

# Custom Module Imports
from backend.config import Config
from database import get_db
from routes import (
    projects_bp,
    map_areas_bp,
    boundaries_bp,
    layers_bp,
    annotations_bp,
    exports_bp
)


# Settings
APP_NAME = 'Printable Maps API'
APP_VERSION = '1.0.0'
ENDPOINT_PROJECTS = '/api/projects'
ENDPOINT_MAP_AREAS = '/api/map-areas'
ENDPOINT_BOUNDARIES = '/api/boundaries'
ENDPOINT_LAYERS = '/api/layers'
ENDPOINT_ANNOTATIONS = '/api/annotations'
ENDPOINT_EXPORTS = '/api/exports'

# Initialize Flask application
app = Flask(__name__)

# Load configuration
config = Config
app.config.from_object(config)

# Enable CORS - Allow frontend apps to access the API
CORS(app, origins=config.CORS_ORIGINS)

# Ensure required directories exist
for folder in [config.UPLOAD_FOLDER, config.EXPORT_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Initialize database
db = get_db(config.DATABASE_PATH)
db.initialize_schema()

# Register blueprints
app.register_blueprint(projects_bp)
app.register_blueprint(map_areas_bp)
app.register_blueprint(boundaries_bp)
app.register_blueprint(layers_bp)
app.register_blueprint(annotations_bp)
app.register_blueprint(exports_bp)


@app.route('/health')
def health_check() -> Response:
    """
    Health check endpoint.

    Returns:
        Response: Health status
    """

    return jsonify(
        {
            'status': 'healthy'
        }
    )


@app.route('/')
def index() -> Response:
    """
    Root endpoint with API information.

    Returns:
        Response: API information
    """

    return jsonify({
        'name': APP_NAME,
        'version': APP_VERSION,
        'endpoints': {
            'projects': ENDPOINT_PROJECTS,
            'map_areas': ENDPOINT_MAP_AREAS,
            'boundaries': ENDPOINT_BOUNDARIES,
            'layers': ENDPOINT_LAYERS,
            'annotations': ENDPOINT_ANNOTATIONS,
            'exports': ENDPOINT_EXPORTS
        }
    })


if __name__ == '__main__':
    """
    Main entry point for running locally.
    Debug mode is enabled for development purposes.
    """

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
