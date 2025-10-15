"""
Flask application for printable maps.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from typing import Dict, Any
import os

from config import get_config
from database import get_db
from routes import (
    projects_bp,
    map_areas_bp,
    boundaries_bp,
    layers_bp,
    annotations_bp,
    exports_bp
)


def create_app(
    config_name: str = None
) -> Flask:
    """
    Create and configure the Flask application.
    
    Args:
        config_name (str): Configuration name (development, production, etc)
    
    Returns:
        Flask: Configured Flask application
    """
    
    app = Flask(__name__)
    
    # Load configuration
    config = get_config(config_name)
    app.config.from_object(config)
    
    # Enable CORS
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
    
    # Health check endpoint
    @app.route('/health')
    def health_check() -> Dict[str, Any]:
        """
        Health check endpoint.
        
        Returns:
            Dict[str, Any]: Health status
        """
        
        return jsonify({'status': 'healthy'})
    
    # Root endpoint
    @app.route('/')
    def index() -> Dict[str, Any]:
        """
        Root endpoint with API information.
        
        Returns:
            Dict[str, Any]: API information
        """
        
        return jsonify({
            'name': 'Printable Maps API',
            'version': '1.0.0',
            'endpoints': {
                'projects': '/api/projects',
                'map_areas': '/api/map-areas',
                'boundaries': '/api/boundaries',
                'layers': '/api/layers',
                'annotations': '/api/annotations',
                'exports': '/api/exports'
            }
        })
    
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
