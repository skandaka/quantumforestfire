"""
Application Configuration Management
Location: backend/config.py

Handles loading of all settings for the Quantum Fire Prediction System,
including API keys, database URLs, and model parameters.
"""

import os
from typing import List, Optional, Dict, Any
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, AnyHttpUrl
import logging
from datetime import timedelta

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Environment Configuration ---

class Settings(BaseSettings):
    """
    Main application settings loaded from environment variables or a .env file.
    """
    # --- Core Application Settings ---
    PROJECT_NAME: str = "QuantumForestFire"
    VERSION: str = "0.1.0"
    DEBUG: bool = Field(default=False, description="Enable debug mode for verbose logging.")
    ENVIRONMENT: str = Field(default="development", description="Application environment: 'development', 'staging', or 'production'.")

    # --- API and Security Settings ---
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(default="a_very_secret_key_that_should_be_changed", description="Secret key for signing JWTs.")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, description="Expiration time for access tokens in minutes.")

    # --- CORS (Cross-Origin Resource Sharing) ---
    BACKEND_CORS_ORIGINS: List[AnyHttpUrl] = Field(
        default=["http://localhost", "http://localhost:3000"],
        description="List of allowed origins for CORS."
    )

    # --- Database Configuration ---
    POSTGRES_SERVER: str = Field(default="localhost", description="PostgreSQL server host.")
    POSTGRES_USER: str = Field(default="postgres", description="PostgreSQL username.")
    POSTGRES_PASSWORD: str = Field(default="postgres", description="PostgreSQL password.")
    POSTGRES_DB: str = Field(default="quantum_fire_db", description="PostgreSQL database name.")
    POSTGRES_PORT: int = Field(default=5432, description="PostgreSQL server port.")

    @property
    def DATABASE_URI(self) -> PostgresDsn:
        """Construct PostgreSQL connection URI."""
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # --- External API Keys ---
    # FIX: Added the missing field for the Classiq API key.
    classiq_api_key: Optional[str] = Field(default=None, alias='CLASSIQ_API_KEY', description="API key for the Classiq platform.")
    NASA_API_KEY: Optional[str] = Field(default=None, description="API key for NASA fire data (e.g., FIRMS).")
    OPENWEATHERMAP_API_KEY: Optional[str] = Field(default=None, description="API key for OpenWeatherMap.")
    MAPBOX_API_KEY: Optional[str] = Field(default=None, description="API key for Mapbox for terrain/tile data.")
    IBM_QUANTUM_API_KEY: Optional[str] = Field(default=None, description="API key for IBM Quantum platform access.")

    # --- Quantum Model Settings ---
    prediction_grid_size: int = Field(default=50, alias='PREDICTION_GRID_SIZE', description="The N x N size of the prediction grid.")
    quantum_backend_simulator: str = Field(default="aer_simulator", description="Default quantum backend for simulation.")
    quantum_backend_hardware: Optional[str] = Field(default=None, description="Default quantum hardware backend (e.g., 'ibm_brisbane').")
    minimum_fire_confidence: float = Field(default=0.7, description="Minimum confidence level (0-1) for a fire detection to be processed.")

    # --- Data Ingestion Settings ---
    data_fetch_interval_seconds: int = Field(default=900, description="Interval in seconds for fetching new data (e.g., 15 minutes).")
    real_time_processing_enabled: bool = Field(default=True, description="Flag to enable or disable real-time data processing.")

    # --- Redis Cache Configuration ---
    REDIS_HOST: str = Field(default="localhost", description="Redis server host.")
    REDIS_PORT: int = Field(default=6379, description="Redis server port.")
    REDIS_CACHE_EXPIRE_SECONDS: int = Field(
        default=300,
        description="Default expiration time for cached items in seconds."
    )

    # --- Celery Task Queue Configuration ---
    CELERY_BROKER_URL: str = Field(default="redis://localhost:6379/0", description="URL for the Celery message broker.")
    CELERY_RESULT_BACKEND: str = Field(default="redis://localhost:6379/0", description="URL for the Celery result backend.")

    # --- Model Meta-Configuration ---
    model_config = SettingsConfigDict(
        env_file=".env",          # Load settings from a .env file
        env_file_encoding='utf-8',
        case_sensitive=False,     # Environment variable names are case-insensitive
        extra='ignore'            # Ignore extra fields that don't match
    )

# --- Instantiate settings object ---
settings = Settings()

# --- Logging Configuration Dictionary ---
LOGGING_CONFIG: Dict[str, Any] = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "default",
        },
    },
    "root": {
        "level": "INFO" if not settings.DEBUG else "DEBUG",
        "handlers": ["console"],
    },
}

# Apply logging configuration
def setup_logging():
    import logging.config
    logging.config.dictConfig(LOGGING_CONFIG)

logger.info("Application settings loaded.")
if settings.DEBUG:
    logger.warning("Debug mode is enabled.")