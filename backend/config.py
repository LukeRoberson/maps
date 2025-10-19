"""
Application configuration settings.

Classes:
    - Config:
        Base configuration class.
"""

import os


class Config:
    """
    Base configuration class for the application.
    Stores configuration settings.

    Attributes:
        SECRET_KEY (str): Secret key for session management
        DATABASE_PATH (str): Path to SQLite database file
        UPLOAD_FOLDER (str): Path for uploaded files
        EXPORT_FOLDER (str): Path for exported map files
        MAX_CONTENT_LENGTH (int): Maximum file upload size
    """

    SECRET_KEY: str = os.environ.get(
        'SECRET_KEY'
    ) or 'dev-secret-key-change-in-production'

    DATABASE_PATH: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        'database',
        'maps.db'
    )

    UPLOAD_FOLDER: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        'uploads'
    )

    EXPORT_FOLDER: str = os.path.join(
        os.path.dirname(__file__),
        '..',
        'exports'
    )

    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB max file size

    # CORS settings
    CORS_ORIGINS: list = [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]
