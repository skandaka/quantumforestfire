"""
Configuration management for Quantum Fire Prediction System
Location: backend/config.py
"""

from pydantic_settings import BaseSettings
from pydantic import Field, field_validator
from typing import Optional, List, Dict, Any
from datetime import timedelta
import os
import json


class Settings(BaseSettings):
    """Application configuration with validation"""

    # Application settings
    app_name: str = "Quantum Fire Prediction System"
    version: str = "1.0.0"
    debug: bool = Field(default=False, alias="DEBUG")
    environment: str = Field(default="development", alias="ENVIRONMENT")

    # Server settings
    host: str = Field(default="0.0.0.0", alias="HOST")
    port: int = Field(default=8000, alias="PORT")
    workers: int = Field(default=4, alias="WORKERS")

    # CORS settings
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8000",
            "https://quantum-fire.app"
        ],
        alias="CORS_ORIGINS"
    )

    # API Keys - External Services
    nasa_firms_api_key: Optional[str] = Field(default=None, alias="NASA_FIRMS_API_KEY")
    noaa_api_key: Optional[str] = Field(default=None, alias="NOAA_API_KEY")
    usgs_api_key: Optional[str] = Field(default=None, alias="USGS_API_KEY")
    mapbox_api_key: Optional[str] = Field(default=None, alias="MAPBOX_API_KEY")

    # Quantum Platform Credentials
    ibm_quantum_token: Optional[str] = Field(default=None, alias="IBM_QUANTUM_TOKEN")
    ibm_quantum_hub: str = Field(default="ibm-q", alias="IBM_QUANTUM_HUB")
    ibm_quantum_group: str = Field(default="open", alias="IBM_QUANTUM_GROUP")
    ibm_quantum_project: str = Field(default="main", alias="IBM_QUANTUM_PROJECT")
    classiq_api_key: Optional[str] = Field(default=None, alias="CLASSIQ_API_KEY")


    # Classiq Configuration (No API key needed - uses SDK authentication)
    classiq_platform_url: str = Field(
        default="https://platform.classiq.io",
        alias="CLASSIQ_PLATFORM_URL"
    )
    classiq_timeout: int = Field(default=300, alias="CLASSIQ_TIMEOUT")

    # Database Configuration
    database_url: str = Field(
        default="postgresql://quantum:quantum@localhost:5432/quantum_fire",
        alias="DATABASE_URL"
    )
    database_pool_size: int = Field(default=20, alias="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=40, alias="DATABASE_MAX_OVERFLOW")

    # Redis Configuration
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        alias="REDIS_URL"
    )
    redis_password: Optional[str] = Field(default=None, alias="REDIS_PASSWORD")
    redis_ssl: bool = Field(default=False, alias="REDIS_SSL")
    cache_ttl: int = Field(default=300, alias="CACHE_TTL")  # 5 minutes

    # Data Collection Settings
    data_collection_interval: int = Field(default=300, alias="DATA_COLLECTION_INTERVAL")  # 5 minutes
    nasa_firms_days_back: int = Field(default=7, alias="NASA_FIRMS_DAYS_BACK")
    weather_forecast_days: int = Field(default=5, alias="WEATHER_FORECAST_DAYS")
    max_fire_points: int = Field(default=10000, alias="MAX_FIRE_POINTS")

    # Quantum Computing Settings
    quantum_backend: str = Field(default="classiq_simulator", alias="QUANTUM_BACKEND")
    quantum_shots: int = Field(default=4096, alias="QUANTUM_SHOTS")
    quantum_optimization_level: int = Field(default=3, alias="QUANTUM_OPTIMIZATION_LEVEL")
    quantum_seed: Optional[int] = Field(default=42, alias="QUANTUM_SEED")
    enable_quantum_error_mitigation: bool = Field(default=True, alias="ENABLE_ERROR_MITIGATION")
    quantum_timeout: int = Field(default=300, alias="QUANTUM_TIMEOUT")  # 5 minutes

    # Prediction Settings
    prediction_interval: int = Field(default=600, alias="PREDICTION_INTERVAL")  # 10 minutes
    prediction_grid_size: int = Field(default=100, alias="PREDICTION_GRID_SIZE")  # 100x100 grid
    prediction_time_steps: int = Field(default=48, alias="PREDICTION_TIME_STEPS")  # 48 hours
    ember_transport_radius: float = Field(default=5.0, alias="EMBER_TRANSPORT_RADIUS")  # km
    minimum_fire_confidence: float = Field(default=0.7, alias="MINIMUM_FIRE_CONFIDENCE")

    # Paradise Fire Demo Settings
    paradise_demo_enabled: bool = Field(default=True, alias="PARADISE_DEMO_ENABLED")
    paradise_fire_date: str = Field(default="2018-11-08", alias="PARADISE_FIRE_DATE")
    paradise_lat: float = Field(default=39.7596, alias="PARADISE_LAT")
    paradise_lon: float = Field(default=-121.6219, alias="PARADISE_LON")

    collection_bounds: Dict[str, float] = Field(
        default={
            "north": 42.0,
            "south": 32.5,
            "east": -114.0,
            "west": -124.5,
        },
        alias="COLLECTION_BOUNDS"
    )

    # Performance Settings
    max_concurrent_predictions: int = Field(default=5, alias="MAX_CONCURRENT_PREDICTIONS")
    request_timeout: int = Field(default=60, alias="REQUEST_TIMEOUT")
    rate_limit_requests: int = Field(default=100, alias="RATE_LIMIT_REQUESTS")
    rate_limit_period: int = Field(default=60, alias="RATE_LIMIT_PERIOD")  # seconds

    # Monitoring and Logging
    log_level: str = Field(default="INFO", alias="LOG_LEVEL")
    enable_performance_monitoring: bool = Field(default=True, alias="ENABLE_MONITORING")
    metrics_export_interval: int = Field(default=60, alias="METRICS_EXPORT_INTERVAL")
    sentry_dsn: Optional[str] = Field(default=None, alias="SENTRY_DSN")

    # Security Settings
    secret_key: str = Field(
        default="quantum-fire-secret-key-change-in-production",
        alias="SECRET_KEY"
    )
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    # Feature Flags
    enable_quantum_ml: bool = Field(default=True, alias="ENABLE_QUANTUM_ML")
    enable_3d_visualization: bool = Field(default=True, alias="ENABLE_3D_VISUALIZATION")
    enable_historical_validation: bool = Field(default=True, alias="ENABLE_HISTORICAL_VALIDATION")
    enable_real_time_updates: bool = Field(default=True, alias="ENABLE_REAL_TIME_UPDATES")

    # File Storage
    upload_dir: str = Field(default="./uploads", alias="UPLOAD_DIR")
    max_upload_size: int = Field(default=100 * 1024 * 1024, alias="MAX_UPLOAD_SIZE")  # 100MB

    # Model Paths
    models_dir: str = Field(default="./models", alias="MODELS_DIR")
    quantum_circuits_dir: str = Field(default="./data/quantum_circuits", alias="QUANTUM_CIRCUITS_DIR")

    # External API Endpoints
    nasa_firms_endpoint: str = Field(
        default="https://firms.modaps.eosdis.nasa.gov/api/area",
        alias="NASA_FIRMS_ENDPOINT"
    )
    noaa_weather_endpoint: str = Field(
        default="https://api.weather.gov",
        alias="NOAA_WEATHER_ENDPOINT"
    )
    usgs_elevation_endpoint: str = Field(
        default="https://nationalmap.gov/epqs/pqs.php",
        alias="USGS_ELEVATION_ENDPOINT"
    )

    @field_validator("cors_origins", mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @field_validator("quantum_backend")
    @classmethod
    def validate_quantum_backend(cls, v: str) -> str:
        """Validate quantum backend selection"""
        valid_backends = [
            "classiq_simulator",
            "classiq_hardware",
            "ibm_simulator",
            "ibm_hardware",
            "local_simulator"
        ]
        if v not in valid_backends:
            raise ValueError(f"Invalid quantum backend: {v}")
        return v

    @field_validator("environment")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment setting"""
        valid_environments = ["development", "staging", "production", "testing"]
        if v not in valid_environments:
            raise ValueError(f"Invalid environment: {v}")
        return v

    def get_redis_settings(self) -> Dict[str, Any]:
        """Get Redis connection settings"""
        return {
            "url": self.redis_url,
            "password": self.redis_password,
            "ssl": self.redis_ssl,
            "decode_responses": True,
            "max_connections": 50
        }

    def get_database_settings(self) -> Dict[str, Any]:
        """Get database connection settings"""
        return {
            "url": self.database_url,
            "pool_size": self.database_pool_size,
            "max_overflow": self.database_max_overflow,
            "pool_pre_ping": True,
            "pool_recycle": 3600
        }

    def get_quantum_config(self) -> Dict[str, Any]:
        """Get quantum computing configuration"""
        return {
            "backend": self.quantum_backend,
            "shots": self.quantum_shots,
            "optimization_level": self.quantum_optimization_level,
            "seed": self.quantum_seed,
            "error_mitigation": self.enable_quantum_error_mitigation,
            "timeout": self.quantum_timeout,
            "classiq": {
                "platform_url": self.classiq_platform_url,
                "timeout": self.classiq_timeout
            },
            "ibm": {
                "token": self.ibm_quantum_token,
                "hub": self.ibm_quantum_hub,
                "group": self.ibm_quantum_group,
                "project": self.ibm_quantum_project
            }
        }

    def get_prediction_config(self) -> Dict[str, Any]:
        """Get prediction configuration"""
        return {
            "grid_size": self.prediction_grid_size,
            "time_steps": self.prediction_time_steps,
            "ember_radius": self.ember_transport_radius,
            "min_confidence": self.minimum_fire_confidence,
            "interval": self.prediction_interval
        }

    def is_production(self) -> bool:
        """Check if running in production"""
        return self.environment == "production"

    def is_development(self) -> bool:
        """Check if running in development"""
        return self.environment == "development"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = False
        extra = "ignore"


# Create global settings instance
settings = Settings()


# Validate critical settings on startup
def validate_settings() -> List[str]:
    """Validate critical settings and warn about missing configurations"""
    warnings = []

    # Check API keys
    if not settings.nasa_firms_api_key:
        warnings.append("NASA FIRMS API key not configured")
    if not settings.noaa_api_key:
        warnings.append("NOAA API key not configured")

    # Check production settings
    if settings.is_production():
        if settings.secret_key == "quantum-fire-secret-key-change-in-production":
            raise ValueError("Secret key must be changed in production!")
        if settings.debug:
            warnings.append("Debug mode is enabled in production")

    return warnings


# Export settings
__all__ = ["settings", "validate_settings"]