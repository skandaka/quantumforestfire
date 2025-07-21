"""
Configuration management for Quantum Fire Prediction System
Location: backend/config.py
"""

from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import Optional, List, Dict, Any
from datetime import timedelta
import os
import json


class Settings(BaseSettings):
    """Application configuration with validation"""

    # Application settings
    app_name: str = "Quantum Fire Prediction System"
    version: str = "1.0.0"
    debug: bool = Field(default=False, env="DEBUG")
    environment: str = Field(default="development", env="ENVIRONMENT")

    # Server settings
    host: str = Field(default="0.0.0.0", env="HOST")
    port: int = Field(default=8000, env="PORT")
    workers: int = Field(default=4, env="WORKERS")

    # CORS settings
    cors_origins: List[str] = Field(
        default=[
            "http://localhost:3000",
            "http://localhost:8000",
            "https://quantum-fire.app"
        ],
        env="CORS_ORIGINS"
    )

    # API Keys - External Services
    nasa_firms_api_key: Optional[str] = Field(None, env="NASA_FIRMS_API_KEY")
    noaa_api_key: Optional[str] = Field(None, env="NOAA_API_KEY")
    usgs_api_key: Optional[str] = Field(None, env="USGS_API_KEY")
    mapbox_api_key: Optional[str] = Field(None, env="MAPBOX_API_KEY")

    # Quantum Platform Credentials
    ibm_quantum_token: Optional[str] = Field(None, env="IBM_QUANTUM_TOKEN")
    ibm_quantum_hub: str = Field(default="ibm-q", env="IBM_QUANTUM_HUB")
    ibm_quantum_group: str = Field(default="open", env="IBM_QUANTUM_GROUP")
    ibm_quantum_project: str = Field(default="main", env="IBM_QUANTUM_PROJECT")

    classiq_api_key: Optional[str] = Field(None, env="CLASSIQ_API_KEY")
    classiq_api_endpoint: str = Field(
        default="https://platform.classiq.io/api/v1",
        env="CLASSIQ_API_ENDPOINT"
    )

    # Database Configuration
    database_url: str = Field(
        default="postgresql://quantum:quantum@localhost:5432/quantum_fire",
        env="DATABASE_URL"
    )
    database_pool_size: int = Field(default=20, env="DATABASE_POOL_SIZE")
    database_max_overflow: int = Field(default=40, env="DATABASE_MAX_OVERFLOW")

    # Redis Configuration
    redis_url: str = Field(
        default="redis://localhost:6379/0",
        env="REDIS_URL"
    )
    redis_password: Optional[str] = Field(None, env="REDIS_PASSWORD")
    redis_ssl: bool = Field(default=False, env="REDIS_SSL")
    cache_ttl: int = Field(default=300, env="CACHE_TTL")  # 5 minutes

    # Data Collection Settings
    data_collection_interval: int = Field(default=300, env="DATA_COLLECTION_INTERVAL")  # 5 minutes
    nasa_firms_days_back: int = Field(default=7, env="NASA_FIRMS_DAYS_BACK")
    weather_forecast_days: int = Field(default=5, env="WEATHER_FORECAST_DAYS")
    max_fire_points: int = Field(default=10000, env="MAX_FIRE_POINTS")

    # Quantum Computing Settings
    quantum_backend: str = Field(default="classiq_simulator", env="QUANTUM_BACKEND")
    quantum_shots: int = Field(default=4096, env="QUANTUM_SHOTS")
    quantum_optimization_level: int = Field(default=3, env="QUANTUM_OPTIMIZATION_LEVEL")
    quantum_seed: Optional[int] = Field(42, env="QUANTUM_SEED")
    enable_quantum_error_mitigation: bool = Field(default=True, env="ENABLE_ERROR_MITIGATION")
    quantum_timeout: int = Field(default=300, env="QUANTUM_TIMEOUT")  # 5 minutes

    # Prediction Settings
    prediction_interval: int = Field(default=600, env="PREDICTION_INTERVAL")  # 10 minutes
    prediction_grid_size: int = Field(default=100, env="PREDICTION_GRID_SIZE")  # 100x100 grid
    prediction_time_steps: int = Field(default=48, env="PREDICTION_TIME_STEPS")  # 48 hours
    ember_transport_radius: float = Field(default=5.0, env="EMBER_TRANSPORT_RADIUS")  # km
    minimum_fire_confidence: float = Field(default=0.7, env="MINIMUM_FIRE_CONFIDENCE")

    # Paradise Fire Demo Settings
    paradise_demo_enabled: bool = Field(default=True, env="PARADISE_DEMO_ENABLED")
    paradise_fire_date: str = Field(default="2018-11-08", env="PARADISE_FIRE_DATE")
    paradise_lat: float = Field(default=39.7596, env="PARADISE_LAT")
    paradise_lon: float = Field(default=-121.6219, env="PARADISE_LON")

    # Performance Settings
    max_concurrent_predictions: int = Field(default=5, env="MAX_CONCURRENT_PREDICTIONS")
    request_timeout: int = Field(default=60, env="REQUEST_TIMEOUT")
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_period: int = Field(default=60, env="RATE_LIMIT_PERIOD")  # seconds

    # Monitoring and Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    enable_performance_monitoring: bool = Field(default=True, env="ENABLE_MONITORING")
    metrics_export_interval: int = Field(default=60, env="METRICS_EXPORT_INTERVAL")
    sentry_dsn: Optional[str] = Field(None, env="SENTRY_DSN")

    # Security Settings
    secret_key: str = Field(
        default="quantum-fire-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    jwt_algorithm: str = Field(default="HS256", env="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(default=30, env="ACCESS_TOKEN_EXPIRE_MINUTES")

    # Feature Flags
    enable_quantum_ml: bool = Field(default=True, env="ENABLE_QUANTUM_ML")
    enable_3d_visualization: bool = Field(default=True, env="ENABLE_3D_VISUALIZATION")
    enable_historical_validation: bool = Field(default=True, env="ENABLE_HISTORICAL_VALIDATION")
    enable_real_time_updates: bool = Field(default=True, env="ENABLE_REAL_TIME_UPDATES")

    # File Storage
    upload_dir: str = Field(default="./uploads", env="UPLOAD_DIR")
    max_upload_size: int = Field(default=100 * 1024 * 1024, env="MAX_UPLOAD_SIZE")  # 100MB

    # Model Paths
    models_dir: str = Field(default="./models", env="MODELS_DIR")
    quantum_circuits_dir: str = Field(default="./data/quantum_circuits", env="QUANTUM_CIRCUITS_DIR")

    # External API Endpoints
    nasa_firms_endpoint: str = Field(
        default="https://firms.modaps.eosdis.nasa.gov/api/area",
        env="NASA_FIRMS_ENDPOINT"
    )
    noaa_weather_endpoint: str = Field(
        default="https://api.weather.gov",
        env="NOAA_WEATHER_ENDPOINT"
    )
    usgs_elevation_endpoint: str = Field(
        default="https://nationalmap.gov/epqs/pqs.php",
        env="USGS_ELEVATION_ENDPOINT"
    )

    @validator("cors_origins", pre=True)
    def parse_cors_origins(cls, v):
        """Parse CORS origins from string or list"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    @validator("quantum_backend")
    def validate_quantum_backend(cls, v):
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

    @validator("environment")
    def validate_environment(cls, v):
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
                "api_key": self.classiq_api_key,
                "endpoint": self.classiq_api_endpoint
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


# Create global settings instance
settings = Settings()


# Validate critical settings on startup
def validate_settings():
    """Validate critical settings and warn about missing configurations"""
    warnings = []

    # Check API keys
    if not settings.nasa_firms_api_key:
        warnings.append("NASA FIRMS API key not configured")
    if not settings.noaa_api_key:
        warnings.append("NOAA API key not configured")
    if not settings.classiq_api_key:
        warnings.append("Classiq API key not configured")
    if not settings.ibm_quantum_token:
        warnings.append("IBM Quantum token not configured")

    # Check production settings
    if settings.is_production():
        if settings.secret_key == "quantum-fire-secret-key-change-in-production":
            raise ValueError("Secret key must be changed in production!")
        if settings.debug:
            warnings.append("Debug mode is enabled in production")

    return warnings


# Export settings
__all__ = ["settings", "validate_settings"]