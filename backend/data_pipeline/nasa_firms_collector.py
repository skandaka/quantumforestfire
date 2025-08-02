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
from utils.ssl_helpers import create_verified_session

logger = logging.getLogger(__name__)


class NASAFIRMSCollector:
    """Collects fire data from NASA FIRMS API"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://firms.modaps.eosdis.nasa.gov/api/area"
        self.session = None
        self._is_healthy = False

    async def initialize(self):
        from utils.ssl_helpers import create_verified_session
        self.session = await create_verified_session()
        self._is_healthy = True
        logger.info("Collector initialized")

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

            logger.error(f"Error fetching FIRMS data: {str(e)}")

            return {

                'active_fires': [],

                'metadata': {

                    'source': 'NASA FIRMS',

                    'collection_time': datetime.now().isoformat(),

                    'bounds': bounds,

                    'error': str(e)

                }

            }

    async def collect(self) -> Dict[str, Any]:
        """Collect fire data - main entry point for data collection"""
        try:
            if not self.session:
                logger.error("Session not initialized. Call initialize() first.")
                return {
                    'active_fires': [],
                    'metadata': {
                        'source': 'NASA FIRMS',
                        'collection_time': datetime.now().isoformat(),
                        'error': 'Session not initialized'
                    }
                }

            # Use default bounds for California region
            bounds = {
                'north': 42.0,
                'south': 32.5,
                'east': -114.0,
                'west': -124.5
            }

            from datetime import datetime, timedelta
            start_date = datetime.now() - timedelta(days=1)
            end_date = datetime.now()

            return await self.get_active_fires(bounds, start_date, end_date)
        except Exception as e:
            logger.error(f"Error in NASA FIRMS collect: {str(e)}")
            return {
                'active_fires': [],
                'metadata': {
                    'source': 'NASA FIRMS',
                    'collection_time': datetime.now().isoformat(),
                    'error': str(e)
                }
            }

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

            try:
                async with self.session.get(url) as response:
                    if response.status == 200:
                        csv_text = await response.text()
                        # Parse CSV manually
                        fires = []
                        lines = csv_text.strip().split('\n')
                        if len(lines) > 1:  # Has header
                            headers = lines[0].split(',')
                            for line in lines[1:]:
                                values = line.split(',')
                                if len(values) == len(headers):
                                    fire_data = dict(zip(headers, values))
                                    fires.append(fire_data)
                        return fires
                    else:
                        logger.error(f"Failed to get historical data: {response.status}")
                        return []
            except Exception as e:
                logger.error(f"Error getting historical fires: {str(e)}")
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