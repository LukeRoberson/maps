"""
Module: config.py

Application configuration settings.

Classes:
    - Config:
        Base configuration class.
"""


# Standard Library Imports
import os


class Config:
    """
    Base configuration class for the application.
    Stores configuration settings.

    Attributes:
        SECRET_KEY (str): Secret key for session management
        DATABASE_PATH (str): Path to SQLite database file
        EXPORT_FOLDER (str): Path for exported map files
    """

    # Get the secret key from environment variables
    SECRET_KEY: str = os.environ.get(
        'SECRET_KEY'
    ) or 'dev-secret-key-change-in-production'

    # Build the path to the database file
    DATABASE_PATH: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        'database',
        'maps.db'
    )

    # Flask session configuration
    SESSION_TYPE = 'filesystem'

    # Set the path of the export folder
    EXPORT_FOLDER: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        'exports'
    )

    # CORS settings
    CORS_ORIGINS: list = [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]
