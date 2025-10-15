"""
Application configuration settings.
"""

import os
from typing import Optional


class Config:
    """
    Base configuration class for the application.

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
        'database',
        'maps.db'
    )

    UPLOAD_FOLDER: str = os.path.join(
        os.path.dirname(__file__),
        'uploads'
    )

    EXPORT_FOLDER: str = os.path.join(
        os.path.dirname(__file__),
        'exports'
    )

    MAX_CONTENT_LENGTH: int = 16 * 1024 * 1024  # 16MB max file size

    # CORS settings
    CORS_ORIGINS: list = [
        'http://localhost:3000',
        'http://127.0.0.1:3000'
    ]


class DevelopmentConfig(Config):
    """
    Development configuration with debug mode enabled.
    """

    DEBUG: bool = True
    TESTING: bool = False


class ProductionConfig(Config):
    """
    Production configuration with security hardening.
    """

    DEBUG: bool = False
    TESTING: bool = False

    # Override secret key requirement in production
    SECRET_KEY: str = os.environ.get('SECRET_KEY')

    @classmethod
    def validate(cls) -> None:
        """
        Validate production configuration.

        Raises:
            ValueError: If required production settings are missing
        """

        if not cls.SECRET_KEY:
            raise ValueError(
                "SECRET_KEY must be set in production environment"
            )


class TestingConfig(Config):
    """
    Testing configuration for unit tests.
    """

    TESTING: bool = True
    DATABASE_PATH: str = ':memory:'


def get_config(
    env: Optional[str] = None
) -> Config:
    """
    Get configuration based on environment.

    Args:
        env (Optional[str]):
            Environment name (development, production, testing)

    Returns:
        Config: Configuration object for the specified environment
    """

    if env is None:
        env = os.environ.get('FLASK_ENV', 'development')

    configs = {
        'development': DevelopmentConfig,
        'production': ProductionConfig,
        'testing': TestingConfig
    }

    return configs.get(env, DevelopmentConfig)()
