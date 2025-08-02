import logging
import os
from functools import lru_cache
from typing import List, Any, Optional

#
# --- FIX: Import the necessary Pydantic V2 components ---
# BaseSettings has been moved to the `pydantic-settings` package.
# field_validator is the new decorator for custom validation logic.
#
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Use Python's standard logging module directly to prevent circular imports.
logger = logging.getLogger(__name__)

# --- Environment Configuration ---
# Determine the application's environment. This is crucial for loading
# the correct .env file (e.g., .env.development, .env.production).
# Defaults to 'development' if not specified.
APP_ENV = os.getenv("APP_ENV", "development")


class Settings(BaseSettings):
    """
    Manages all application settings using Pydantic V2's settings management.
    It loads configuration from environment variables and .env files, providing
    robust validation and type-hinting for all parameters.

    This class serves as the single source of truth for all configuration
    parameters across the entire backend application.
    """
    # Define the model configuration to load from the correct .env file.
    # `extra='ignore'` prevents the app from crashing if unexpected environment
    # variables are present.
    model_config = SettingsConfigDict(
        env_file=f".env.{APP_ENV}",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra='ignore'
    )

    # --- Core Application Settings ---
    APP_NAME: str = "Quantum Fire Prediction API"
    APP_VERSION: str = "1.0.0"
    APP_ENV: str = APP_ENV
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # --- API and Server Settings ---
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "QuantumFire"
    SERVER_HOST: str = "0.0.0.0"
    SERVER_PORT: int = 8000

    # --- CORS (Cross-Origin Resource Sharing) Settings ---
    #
    # --- FIX: The type is changed from List[AnyHttpUrl] to Any ---
    # This prevents Pydantic from trying to automatically parse the env var
    # as a JSON string. We will handle the parsing manually and correctly
    # in the validator below.
    #
    CORS_ORIGINS: Any = []

    @field_validator("CORS_ORIGINS", mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[AnyHttpUrl]:
        """
        Validates and assembles the list of allowed CORS origins from a
        comma-separated string in an environment variable.
        """
        if isinstance(v, str):
            # If the value is a string, split it by commas and strip whitespace.
            # This correctly handles the format from your .env file.
            return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            # If it's already a list (e.g., from direct instantiation), return it.
            return v
        raise ValueError("CORS_ORIGINS must be a comma-separated string or a list of URLs")

    # --- Redis Database Settings ---
    # Connection details for the Redis instance used for caching, pub/sub,
    # and storing application state.
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None

    @field_validator("REDIS_URL", mode='before')
    @classmethod
    def assemble_redis_connection(cls, v: Optional[str], values) -> Any:
        """
        Constructs the Redis connection URL from individual components if it's
        not provided directly as a single URL.
        """
        if isinstance(v, str):
            # If REDIS_URL is already provided, use it.
            return v

        # Otherwise, build it from the other REDIS_* variables.
        data = values.data
        host = data.get("REDIS_HOST", "localhost")
        port = data.get("REDIS_PORT", 6379)
        db = data.get("REDIS_DB", 0)
        password = data.get("REDIS_PASSWORD")

        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"

    # --- Data Collection Settings ---
    # Intervals for the background tasks that fetch data and run predictions.
    DATA_COLLECTION_INTERVAL_SECONDS: int = 300
    PREDICTION_INTERVAL_SECONDS: int = 600

    # --- External API Keys and Settings ---
    # Securely manage API keys for external data sources.
    # These should ALWAYS be set via environment variables, not hardcoded.
    NASA_FIRMS_API_KEY: str
    MAP_QUEST_API_KEY: str  # Note: Renamed from MAPBOX_API_KEY to match usage

    # --- Quantum Provider Settings ---
    # Configuration for connecting to quantum computing services.
    USE_REAL_QUANTUM_BACKENDS: bool = False
    CLASSIQ_API_URL: str = "https://api.classiq.io"

    # The IBM Quantum token is optional; Classiq can be used without it.
    # If provided, it enables access to IBM backends through the Classiq platform.
    IBM_QUANTUM_TOKEN: Optional[str] = None


@lru_cache()
def get_settings() -> Settings:
    """
    Provides the application settings as a cached singleton.

    Using lru_cache ensures that the Settings object is created only once,
    preventing the overhead of reading .env files and validating settings
    on every call. This is a performance best practice.

    Returns:
        The cached application settings instance.
    """
    logger.info(f"Loading settings for environment: {APP_ENV}")
    try:
        settings_instance = Settings()
        # Log a subset of settings for debugging, excluding secrets.
        logger.info(f"Settings loaded successfully.")
        logger.debug(
            f"Debug mode: {settings_instance.DEBUG}, Log level: {settings_instance.LOG_LEVEL}"
        )
        return settings_instance
    except Exception as e:
        # If settings fail to load, it's a critical error.
        logger.critical(f"🚨 FATAL: FAILED TO LOAD SETTINGS. Check your .env file and environment variables. Error: {e}",
                        exc_info=True)
        raise


# --- Global `settings` instance ---
# This is the single instance of the settings that will be imported and used
# throughout the rest of the application.
settings = get_settings()