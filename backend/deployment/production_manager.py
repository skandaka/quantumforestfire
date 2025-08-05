"""
Production Configuration and Deployment Manager
Handles environment-specific settings, scaling, and monitoring
"""
import os
import logging
import asyncio
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum
import yaml
import json

logger = logging.getLogger(__name__)

class Environment(Enum):
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"

class ScalingMode(Enum):
    MANUAL = "manual"
    AUTO = "auto"
    HYBRID = "hybrid"

@dataclass
class ProductionConfig:
    """Production deployment configuration"""
    environment: Environment
    debug: bool
    log_level: str
    
    # Database configuration
    database_url: str
    redis_url: str
    redis_cluster: bool
    
    # API configuration
    api_host: str
    api_port: int
    workers: int
    max_connections: int
    
    # Security
    secret_key: str
    allowed_hosts: List[str]
    cors_origins: List[str]
    rate_limit: int
    
    # Quantum processing
    quantum_backend: str
    classiq_token: str
    quantum_hardware: bool
    
    # Monitoring
    enable_metrics: bool
    metrics_endpoint: str
    health_check_interval: int
    
    # Scaling
    scaling_mode: ScalingMode
    min_replicas: int
    max_replicas: int
    cpu_threshold: float
    memory_threshold: float

class ProductionManager:
    """Manages production deployment and scaling"""
    
    def __init__(self, config_file: Optional[str] = None):
        self.config = None
        self.config_file = config_file or "production.yaml"
        self.health_status = {}
        self.performance_metrics = {}
        self.scaling_decisions = []
        
    async def initialize(self):
        """Initialize production configuration"""
        try:
            logger.info("Initializing Production Manager...")
            
            # Load configuration
            await self._load_configuration()
            
            # Validate environment
            await self._validate_environment()
            
            # Setup monitoring
            await self._setup_monitoring()
            
            # Initialize security
            await self._setup_security()
            
            # Configure scaling
            await self._setup_scaling()
            
            logger.info(f"Production Manager initialized for {self.config.environment.value}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Production Manager: {e}")
            raise
    
    async def _load_configuration(self):
        """Load production configuration from file or environment"""
        try:
            # Try to load from YAML file first
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config_data = yaml.safe_load(f)
                logger.info(f"Configuration loaded from {self.config_file}")
            else:
                # Fallback to environment variables
                config_data = self._get_config_from_env()
                logger.info("Configuration loaded from environment variables")
            
            # Create ProductionConfig instance
            self.config = ProductionConfig(
                environment=Environment(config_data.get('environment', 'development')),
                debug=config_data.get('debug', False),
                log_level=config_data.get('log_level', 'INFO'),
                
                database_url=config_data.get('database_url', 'sqlite:///quantum_fire.db'),
                redis_url=config_data.get('redis_url', 'redis://localhost:6379'),
                redis_cluster=config_data.get('redis_cluster', False),
                
                api_host=config_data.get('api_host', '0.0.0.0'),
                api_port=config_data.get('api_port', 8000),
                workers=config_data.get('workers', 4),
                max_connections=config_data.get('max_connections', 1000),
                
                secret_key=config_data.get('secret_key', 'dev-secret-key'),
                allowed_hosts=config_data.get('allowed_hosts', ['*']),
                cors_origins=config_data.get('cors_origins', ['*']),
                rate_limit=config_data.get('rate_limit', 100),
                
                quantum_backend=config_data.get('quantum_backend', 'simulator'),
                classiq_token=config_data.get('classiq_token', ''),
                quantum_hardware=config_data.get('quantum_hardware', False),
                
                enable_metrics=config_data.get('enable_metrics', True),
                metrics_endpoint=config_data.get('metrics_endpoint', '/metrics'),
                health_check_interval=config_data.get('health_check_interval', 30),
                
                scaling_mode=ScalingMode(config_data.get('scaling_mode', 'manual')),
                min_replicas=config_data.get('min_replicas', 1),
                max_replicas=config_data.get('max_replicas', 10),
                cpu_threshold=config_data.get('cpu_threshold', 70.0),
                memory_threshold=config_data.get('memory_threshold', 80.0)
            )
            
        except Exception as e:
            logger.error(f"Failed to load configuration: {e}")
            raise
    
    def _get_config_from_env(self) -> Dict[str, Any]:
        """Get configuration from environment variables"""
        return {
            'environment': os.getenv('ENVIRONMENT', 'development'),
            'debug': os.getenv('DEBUG', 'false').lower() == 'true',
            'log_level': os.getenv('LOG_LEVEL', 'INFO'),
            
            'database_url': os.getenv('DATABASE_URL', 'sqlite:///quantum_fire.db'),
            'redis_url': os.getenv('REDIS_URL', 'redis://localhost:6379'),
            'redis_cluster': os.getenv('REDIS_CLUSTER', 'false').lower() == 'true',
            
            'api_host': os.getenv('API_HOST', '0.0.0.0'),
            'api_port': int(os.getenv('API_PORT', '8000')),
            'workers': int(os.getenv('WORKERS', '4')),
            'max_connections': int(os.getenv('MAX_CONNECTIONS', '1000')),
            
            'secret_key': os.getenv('SECRET_KEY', 'dev-secret-key'),
            'allowed_hosts': os.getenv('ALLOWED_HOSTS', '*').split(','),
            'cors_origins': os.getenv('CORS_ORIGINS', '*').split(','),
            'rate_limit': int(os.getenv('RATE_LIMIT', '100')),
            
            'quantum_backend': os.getenv('QUANTUM_BACKEND', 'simulator'),
            'classiq_token': os.getenv('CLASSIQ_TOKEN', ''),
            'quantum_hardware': os.getenv('QUANTUM_HARDWARE', 'false').lower() == 'true',
            
            'enable_metrics': os.getenv('ENABLE_METRICS', 'true').lower() == 'true',
            'metrics_endpoint': os.getenv('METRICS_ENDPOINT', '/metrics'),
            'health_check_interval': int(os.getenv('HEALTH_CHECK_INTERVAL', '30')),
            
            'scaling_mode': os.getenv('SCALING_MODE', 'manual'),
            'min_replicas': int(os.getenv('MIN_REPLICAS', '1')),
            'max_replicas': int(os.getenv('MAX_REPLICAS', '10')),
            'cpu_threshold': float(os.getenv('CPU_THRESHOLD', '70.0')),
            'memory_threshold': float(os.getenv('MEMORY_THRESHOLD', '80.0'))
        }
    
    async def _validate_environment(self):
        """Validate production environment requirements"""
        validations = []
        
        # Check critical configuration
        if self.config.environment == Environment.PRODUCTION:
            if self.config.debug:
                validations.append("DEBUG should be False in production")
            
            if self.config.secret_key == 'dev-secret-key':
                validations.append("SECRET_KEY must be set to a secure value in production")
            
            if '*' in self.config.allowed_hosts:
                validations.append("ALLOWED_HOSTS should not include '*' in production")
        
        # Check quantum configuration
        if self.config.quantum_hardware and not self.config.classiq_token:
            validations.append("CLASSIQ_TOKEN required for quantum hardware")
        
        # Check scaling configuration
        if self.config.scaling_mode != ScalingMode.MANUAL:
            if self.config.min_replicas >= self.config.max_replicas:
                validations.append("MIN_REPLICAS must be less than MAX_REPLICAS")
        
        if validations:
            error_msg = "Configuration validation failed:\n" + "\n".join(f"- {v}" for v in validations)
            logger.error(error_msg)
            if self.config.environment == Environment.PRODUCTION:
                raise ValueError(error_msg)
            else:
                logger.warning("Configuration issues detected but proceeding in non-production environment")
    
    async def _setup_monitoring(self):
        """Setup production monitoring and health checks"""
        if not self.config.enable_metrics:
            return
        
        logger.info("Setting up production monitoring...")
        
        # Initialize health status
        self.health_status = {
            "api": {"status": "healthy", "last_check": datetime.utcnow().isoformat()},
            "database": {"status": "healthy", "last_check": datetime.utcnow().isoformat()},
            "redis": {"status": "healthy", "last_check": datetime.utcnow().isoformat()},
            "quantum": {"status": "healthy", "last_check": datetime.utcnow().isoformat()},
            "data_pipeline": {"status": "healthy", "last_check": datetime.utcnow().isoformat()}
        }
        
        # Start health check task
        asyncio.create_task(self._health_check_loop())
    
    async def _setup_security(self):
        """Setup production security measures"""
        logger.info("Configuring security measures...")
        
        # Rate limiting configuration
        if self.config.rate_limit > 0:
            logger.info(f"Rate limiting enabled: {self.config.rate_limit} requests/minute")
        
        # CORS configuration
        if self.config.environment == Environment.PRODUCTION:
            logger.info(f"CORS origins: {self.config.cors_origins}")
        
        # Security headers would be configured here
        logger.info("Security configuration completed")
    
    async def _setup_scaling(self):
        """Setup auto-scaling configuration"""
        if self.config.scaling_mode == ScalingMode.MANUAL:
            logger.info("Manual scaling mode - auto-scaling disabled")
            return
        
        logger.info(f"Auto-scaling enabled: {self.config.scaling_mode.value}")
        logger.info(f"Replica range: {self.config.min_replicas} - {self.config.max_replicas}")
        logger.info(f"Thresholds: CPU {self.config.cpu_threshold}%, Memory {self.config.memory_threshold}%")
        
        # Start scaling monitor
        asyncio.create_task(self._scaling_monitor_loop())
    
    async def _health_check_loop(self):
        """Continuous health monitoring loop"""
        while True:
            try:
                await self._perform_health_checks()
                await asyncio.sleep(self.config.health_check_interval)
            except Exception as e:
                logger.error(f"Health check error: {e}")
                await asyncio.sleep(self.config.health_check_interval)
    
    async def _perform_health_checks(self):
        """Perform health checks on all components"""
        checks = [
            ("api", self._check_api_health),
            ("database", self._check_database_health),
            ("redis", self._check_redis_health),
            ("quantum", self._check_quantum_health),
            ("data_pipeline", self._check_data_pipeline_health)
        ]
        
        for component, check_func in checks:
            try:
                status = await check_func()
                self.health_status[component] = {
                    "status": "healthy" if status else "unhealthy",
                    "last_check": datetime.utcnow().isoformat()
                }
            except Exception as e:
                self.health_status[component] = {
                    "status": "error",
                    "error": str(e),
                    "last_check": datetime.utcnow().isoformat()
                }
    
    async def _check_api_health(self) -> bool:
        """Check API health"""
        # Simulate API health check
        return True
    
    async def _check_database_health(self) -> bool:
        """Check database connectivity"""
        # Simulate database health check
        return True
    
    async def _check_redis_health(self) -> bool:
        """Check Redis connectivity"""
        # Simulate Redis health check
        return True
    
    async def _check_quantum_health(self) -> bool:
        """Check quantum processing health"""
        # Simulate quantum system health check
        return True
    
    async def _check_data_pipeline_health(self) -> bool:
        """Check data pipeline health"""
        # Simulate data pipeline health check
        return True
    
    async def _scaling_monitor_loop(self):
        """Monitor system metrics and make scaling decisions"""
        if self.config.scaling_mode == ScalingMode.MANUAL:
            return
        
        while True:
            try:
                await self._check_scaling_conditions()
                await asyncio.sleep(60)  # Check every minute
            except Exception as e:
                logger.error(f"Scaling monitor error: {e}")
                await asyncio.sleep(60)
    
    async def _check_scaling_conditions(self):
        """Check if scaling is needed based on metrics"""
        try:
            # Get current metrics (simulated)
            import random
            cpu_usage = random.uniform(30, 90)
            memory_usage = random.uniform(40, 85)
            current_replicas = random.randint(self.config.min_replicas, self.config.max_replicas)
            
            # Update performance metrics
            self.performance_metrics.update({
                "cpu_usage": cpu_usage,
                "memory_usage": memory_usage,
                "current_replicas": current_replicas,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Scaling decision logic
            scale_up = (
                (cpu_usage > self.config.cpu_threshold or memory_usage > self.config.memory_threshold) and
                current_replicas < self.config.max_replicas
            )
            
            scale_down = (
                cpu_usage < self.config.cpu_threshold * 0.5 and memory_usage < self.config.memory_threshold * 0.5 and
                current_replicas > self.config.min_replicas
            )
            
            if scale_up:
                await self._scale_up()
            elif scale_down:
                await self._scale_down()
            
        except Exception as e:
            logger.error(f"Scaling check failed: {e}")
    
    async def _scale_up(self):
        """Scale up the application"""
        decision = {
            "action": "scale_up",
            "timestamp": datetime.utcnow().isoformat(),
            "reason": "High resource usage detected",
            "metrics": self.performance_metrics.copy()
        }
        
        self.scaling_decisions.append(decision)
        logger.info(f"Scaling up due to high resource usage: {decision}")
    
    async def _scale_down(self):
        """Scale down the application"""
        decision = {
            "action": "scale_down",
            "timestamp": datetime.utcnow().isoformat(),
            "reason": "Low resource usage detected",
            "metrics": self.performance_metrics.copy()
        }
        
        self.scaling_decisions.append(decision)
        logger.info(f"Scaling down due to low resource usage: {decision}")
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get current health status"""
        overall_healthy = all(
            component["status"] == "healthy" 
            for component in self.health_status.values()
        )
        
        return {
            "overall_status": "healthy" if overall_healthy else "unhealthy",
            "components": self.health_status,
            "last_updated": datetime.utcnow().isoformat()
        }
    
    def get_performance_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics"""
        return {
            "current_metrics": self.performance_metrics,
            "scaling_decisions": self.scaling_decisions[-10:],  # Last 10 decisions
            "configuration": {
                "scaling_mode": self.config.scaling_mode.value,
                "thresholds": {
                    "cpu": self.config.cpu_threshold,
                    "memory": self.config.memory_threshold
                },
                "replica_limits": {
                    "min": self.config.min_replicas,
                    "max": self.config.max_replicas
                }
            }
        }
    
    def export_configuration(self) -> Dict[str, Any]:
        """Export current configuration for debugging"""
        return {
            "environment": self.config.environment.value,
            "debug": self.config.debug,
            "api_config": {
                "host": self.config.api_host,
                "port": self.config.api_port,
                "workers": self.config.workers
            },
            "security_config": {
                "rate_limit": self.config.rate_limit,
                "cors_origins": self.config.cors_origins
            },
            "quantum_config": {
                "backend": self.config.quantum_backend,
                "hardware": self.config.quantum_hardware
            },
            "scaling_config": {
                "mode": self.config.scaling_mode.value,
                "min_replicas": self.config.min_replicas,
                "max_replicas": self.config.max_replicas
            }
        }

# Global production manager instance
production_manager = ProductionManager()
