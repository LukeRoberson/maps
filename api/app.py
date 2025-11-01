"""
Backend API for Printable Maps Application.

Routes:
    /health:
        Health check endpoint.

Classes:
    ColouredFormatter:
        Custom log formatter that adds color codes based on log level.

Functions:
    configure_logging:
        Configure application logging.

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
from flask_session import Session
import os
import logging

# Custom Module Imports
from backend.config import Config
from database import (
    DatabaseContext,
    DatabaseManager,
)
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


class ColouredFormatter(
    logging.Formatter
):
    """
    Custom formatter that adds color codes to log messages based on level.

    Attributes:
        COLORS (dict): Mapping of log levels to ANSI color codes
        RESET (str): ANSI reset code

    Methods:
        format:
            Format log record with appropriate color
    """

    # ANSI color codes
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m'  # Magenta
    }
    RESET = '\033[0m'

    def format(
        self,
        record: logging.LogRecord
    ) -> str:
        """
        Format log record with appropriate color.

        Args:
            record (logging.LogRecord): The log record to format

        Returns:
            str: Formatted log message with color codes
        """

        log_color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{log_color}{record.levelname}{self.RESET}"
        return super().format(record)


def configure_logging(
    debug: bool = False
) -> None:
    """
    Configure application logging.

    Args:
        debug (bool): If True, set log level to DEBUG. Default is False.

    Returns:
        None
    """

    level = logging.DEBUG if debug else logging.INFO

    # Create formatters
    file_formatter = logging.Formatter(
        '%(asctime)s - %(levelname)s - %(message)s'
    )
    console_formatter = ColouredFormatter(
        '%(levelname)s - %(message)s'
    )

    # Create handlers
    file_handler = logging.FileHandler('api.log')
    file_handler.setFormatter(file_formatter)

    stream_handler = logging.StreamHandler()
    stream_handler.setFormatter(console_formatter)

    # Configure root logger
    logging.basicConfig(
        level=level,
        handlers=[
            file_handler,
            stream_handler
        ]
    )


# Set up logging for the application
configure_logging(debug=False)

# Initialize Flask application
app = Flask(__name__)

# Load configuration
config = Config
app.config.from_object(config)

# Enable CORS - Allow frontend apps to access the API
CORS(app, origins=config.CORS_ORIGINS)

# Ensure required directories exist
for folder in [config.EXPORT_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Initialize database
with DatabaseContext(config.DATABASE_PATH) as db_ctx:
    db_manager = DatabaseManager(db_ctx)
    db_manager.initialise()

Session(app)

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


@app.route('/api/config')
def get_config() -> Response:
    """
    Get configuration defaults.

    Returns:
        Response: Configuration defaults including map center and zoom
    """

    return jsonify({
        'default_map': {
            'center_lat': Config.DEFAULT_MAP_LATITUDE,
            'center_lon': Config.DEFAULT_MAP_LONGITUDE,
            'zoom_level': Config.DEFAULT_MAP_ZOOM
        }
    })


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

    logging.info('Starting Printable Maps API...')

    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True
    )
