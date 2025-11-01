"""
Module: config.py

Application configuration settings.

Classes:
    - Config:
        Base configuration class.
"""


# Standard Library Imports
import os
import yaml


class Config:
    """
    Base configuration class for the application.
    Stores configuration settings.

    Attributes:
        SECRET_KEY (str): Secret key for session management
        DATABASE_PATH (str): Path to SQLite database file
        EXPORT_FOLDER (str): Path for exported map files
        CORS_ORIGINS (list): List of allowed CORS origins
        DEFAULT_MAP_LATITUDE (float): Default latitude for new projects
        DEFAULT_MAP_LONGITUDE (float): Default longitude for new projects
        DEFAULT_MAP_ZOOM (int): Default zoom level for new projects
    """

    # Path to configuration YAML file
    CONFIG_YAML_PATH: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        'config.yaml'
    )

    # Load YAML configuration if file exists
    _config_data: dict = {}
    if os.path.exists(CONFIG_YAML_PATH):
        with open(CONFIG_YAML_PATH, 'r', encoding='utf-8') as f:
            _config_data = yaml.safe_load(f) or {}

    # Get the secret key from environment variables
    SECRET_KEY: str = os.environ.get(
        'SECRET_KEY'
    ) or 'dev-secret-key-change-in-production'

    # Build the path to the database file
    db_config: dict = _config_data.get('database', {})
    db_folder: str = db_config.get('folder', '../database')
    db_filename: str = db_config.get('filename', 'maps.db')
    DATABASE_PATH: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        db_folder.lstrip('../'),
        db_filename
    )

    # Flask session configuration
    SESSION_TYPE: str = 'filesystem'

    # Set the path of the export folder
    export_dir: str = _config_data.get('export_dir', '../exports')
    EXPORT_FOLDER: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        export_dir.lstrip('../')
    )

    # CORS settings
    CORS_ORIGINS: list = _config_data.get('cors_origins', [])

    # Default map settings for new projects
    default_map: dict = _config_data.get('default_map', {})
    DEFAULT_MAP_LATITUDE: float = default_map.get('lat', 0.0)
    DEFAULT_MAP_LONGITUDE: float = default_map.get('long', 0.0)
    DEFAULT_MAP_ZOOM: int = default_map.get('default_zoom', 4)
