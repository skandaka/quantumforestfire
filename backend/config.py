import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    """Manages application settings and environment variables."""

    # Use model_config to specify the .env file and other settings
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), '..', '.env'),
        env_file_encoding='utf-8',
        extra='ignore'
    )

    # Classiq Platform Credentials
    CLASSIC_API_TOKEN: str = ""

    # IBM Quantum Platform Credentials
    IBM_QUANTUM_TOKEN: str = ""

    # Data Source API Keys
    NASA_API_KEY: str = ""
    NOAA_API_TOKEN: str = ""

    # Redis Configuration
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""

    # Application Settings
    LOG_LEVEL: str = "INFO"


@lru_cache()
def get_settings() -> Settings:
    """
    Returns a cached instance of the application settings.
    Using lru_cache ensures the .env file is read only once.
    """
    return Settings()