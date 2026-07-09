"""
Configuration management for the USETAI website application.

Provides configuration classes for different deployment environments
(development, testing, production) with environment-aware settings.
"""

import os
from typing import Dict, Any


class Config:
    """
    Base configuration class with common settings.

    Attributes:
        DEBUG: Enable Flask debug mode
        TESTING: Enable testing mode
        JSON_SORT_KEYS: Sort JSON response keys
    """

    DEBUG: bool = False
    TESTING: bool = False
    JSON_SORT_KEYS: bool = True


class DevelopmentConfig(Config):
    """
    Development environment configuration.

    Enables debug mode and verbose logging for local development.
    """

    DEBUG: bool = True
    ENV: str = "development"


class TestingConfig(Config):
    """
    Testing environment configuration.

    Enables testing mode with minimal logging.
    """

    TESTING: bool = True
    ENV: str = "testing"


class ProductionConfig(Config):
    """
    Production environment configuration.

    Disables debug mode and enforces strict settings for security.
    """

    DEBUG: bool = False
    ENV: str = "production"


def get_config() -> type:
    """
    Get the appropriate configuration class based on environment.

    Reads the FLASK_ENV environment variable and returns the
    corresponding configuration class.

    Returns:
        type: Configuration class (DevelopmentConfig, TestingConfig,
            or ProductionConfig)

    Note:
        Defaults to DevelopmentConfig if FLASK_ENV is not set.
    """
    env: str = os.getenv("FLASK_ENV", "development").lower()

    config_map: Dict[str, type] = {
        "development": DevelopmentConfig,
        "testing": TestingConfig,
        "production": ProductionConfig,
    }

    return config_map.get(env, DevelopmentConfig)
