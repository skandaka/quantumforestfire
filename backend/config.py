import logging
import os
from functools import lru_cache
from typing import List, Any, Optional

from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

logger = logging.getLogger(__name__)
APP_ENV = os.getenv("APP_ENV", "development")


class Settings(BaseSettings):
    """Manages all application settings using Pydantic V2's settings management."""

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

    # --- CORS Settings ---
    CORS_ORIGINS: Any = []

    @field_validator("CORS_ORIGINS", mode='before')
    @classmethod
    def assemble_cors_origins(cls, v: Any) -> List[AnyHttpUrl]:
        if isinstance(v, str):
            return [item.strip() for item in v.split(",") if item.strip()]
        if isinstance(v, list):
            return v
        raise ValueError("CORS_ORIGINS must be a comma-separated string or a list of URLs")

    # --- Redis Database Settings ---
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_URL: Optional[str] = None

    @field_validator("REDIS_URL", mode='before')
    @classmethod
    def assemble_redis_connection(cls, v: Optional[str], values) -> Any:
        if isinstance(v, str):
            return v
        data = values.data
        host = data.get("REDIS_HOST", "localhost")
        port = data.get("REDIS_PORT", 6379)
        db = data.get("REDIS_DB", 0)
        password = data.get("REDIS_PASSWORD")
        if password:
            return f"redis://:{password}@{host}:{port}/{db}"
        return f"redis://{host}:{port}/{db}"

    # --- Data Collection Settings ---
    DATA_COLLECTION_INTERVAL_SECONDS: int = 300
    PREDICTION_INTERVAL_SECONDS: int = 600

    # --- External API Keys ---
    NASA_FIRMS_API_KEY: str
    MAP_QUEST_API_KEY: str

    # --- Quantum Provider Settings ---
    USE_REAL_QUANTUM_BACKENDS: bool = False
    CLASSIQ_API_URL: str = "https://api.classiq.io"

    ibm_quantum_token: Optional[str] = None
    quantum_circuits_dir: str = "data/quantum_circuits"
    classiq_platform_url: str = "https://platform.classiq.io"

    # --- Performance Monitoring ---
    enable_performance_monitoring: bool = True
    metrics_export_interval: int = 60

    # --- Redis settings for performance monitor ---
    redis_url: Optional[str] = None
    redis_password: Optional[str] = None

    @field_validator("redis_url", mode='before')
    @classmethod
    def set_redis_url(cls, v: Optional[str], values) -> Optional[str]:
        if v:
            return v
        return values.data.get("REDIS_URL")


@lru_cache()
def get_settings() -> Settings:
    logger.info(f"Loading settings for environment: {APP_ENV}")
    try:
        settings_instance = Settings()
        logger.info(f"Settings loaded successfully.")
        logger.debug(f"Debug mode: {settings_instance.DEBUG}, Log level: {settings_instance.LOG_LEVEL}")
        return settings_instance
    except Exception as e:
        logger.critical(f"🚨 FATAL: FAILED TO LOAD SETTINGS. Check your .env file and environment variables. Error: {e}",
                        exc_info=True)
        raise


settings = get_settings()
