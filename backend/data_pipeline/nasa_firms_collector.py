"""
NASA FIRMS Data Collector
Location: backend/data_pipeline/nasa_firms_collector.py
"""

import aiohttp
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio

from config import settings
from data_pipeline.noaa_weather_collector import NOAAWeatherCollector
from data_pipeline.usgs_terrain_collector import USGSTerrainCollector

logger = logging.getLogger(__name__)


class NASAFIRMSCollector:
    """Collects fire data from NASA FIRMS API"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://firms.modaps.eosdis.nasa.gov/api/area"
        self.session = None
        self._is_healthy = False

    async def initialize(self):
        """Initialize all data collectors and connections"""
        logger.info("Initializing Real-Time Data Manager...")

        # Initialize Redis for caching
        try:
            import redis.asyncio as redis
            self.redis_client = await redis.from_url(
                settings.redis_url,
                password=settings.redis_password,
                decode_responses=True
            )
            # Test connection
            await self.redis_client.ping()
            self.redis_available = True
            logger.info("Successfully connected to Redis")
        except Exception as e:
            logger.warning(f"Redis not available: {e}. Running without cache.")
            self.redis_available = False
            self.redis_client = None

        # Initialize data collectors
        self.collectors['nasa_firms'] = NASAFIRMSCollector(settings.nasa_firms_api_key or 'demo_key')
        self.collectors['noaa_weather'] = NOAAWeatherCollector(settings.noaa_api_key or 'demo_key')
        self.collectors['usgs_terrain'] = USGSTerrainCollector(settings.usgs_api_key or 'demo_key')

        # Initialize each collector
        for name, collector in self.collectors.items():
            await collector.initialize()
            logger.info(f"Initialized {name} collector")

        self.is_running = True
        logger.info("Real-Time Data Manager initialized successfully")

    def is_healthy(self) -> bool:
        """Check if collector is healthy"""
        return self._is_healthy and self.session is not None

    async def get_active_fires(
            self,
            bounds: Dict[str, float],
            start_date: datetime,
            end_date: datetime,
            confidence_threshold: float = 0.7
    ) -> Dict[str, Any]:
        """Get active fire data from NASA FIRMS"""
        try:
            # Build API URL
            url = f"{self.base_url}/csv/{self.api_key}/MODIS_NRT/{bounds['west']},{bounds['south']},{bounds['east']},{bounds['north']}/1"

            async with self.session.get(url) as response:
                if response.status == 200:
                    # NASA FIRMS returns CSV, not JSON
                    csv_text = await response.text()

                    # Parse CSV
                    import csv
                    from io import StringIO

                    active_fires = []
                    reader = csv.DictReader(StringIO(csv_text))

                    for row in reader:
                        if float(row.get('confidence', 0)) >= confidence_threshold * 100:
                            active_fires.append({
                                'latitude': float(row['latitude']),
                                'longitude': float(row['longitude']),
                                'brightness_temperature': float(row.get('brightness', 0)),
                                'frp': float(row.get('frp', 0)),
                                'confidence': float(row.get('confidence', 0)) / 100,
                                'detection_time': row.get('acq_date') + 'T' + row.get('acq_time', '00:00'),
                                'satellite': row.get('satellite', 'MODIS')
                            })

                    return {
                        'active_fires': active_fires,
                        'metadata': {
                            'source': 'NASA FIRMS',
                            'collection_time': datetime.now().isoformat(),
                            'bounds': bounds,
                            'total_detections': len(active_fires)
                        }
                    }
                else:
                    logger.error(f"NASA FIRMS API returned status {response.status}")
                    return {
                        'active_fires': [],
                        'metadata': {
                            'source': 'NASA FIRMS',
                            'collection_time': datetime.now().isoformat(),
                            'bounds': bounds,
                            'error': f'API returned status {response.status}'
                        }
                    }

        except Exception as e:
            logger.error(f"Error collecting FIRMS data: {str(e)}")
            self._is_healthy = False
            raise

    async def get_historical_fires(
        self,
        bounds: Dict[str, float],
        days_back: int = 7
    ) -> List[Dict[str, Any]]:
        """Get historical fire data"""
        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days_back)

            url = f"{self.base_url}/csv/{self.api_key}/MODIS_NRT/{bounds['west']},{bounds['south']},{bounds['east']},{bounds['north']}/{days_back}"

            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    return data
                else:
                    logger.error(f"Failed to get historical data: {response.status}")
                    return []

        except Exception as e:
            logger.error(f"Error getting historical fires: {str(e)}")
            return []

    async def shutdown(self):
        """Shutdown the collector"""
        if self.session:
            await self.session.close()
        self._is_healthy = False
        logger.info("NASA FIRMS collector shutdown")