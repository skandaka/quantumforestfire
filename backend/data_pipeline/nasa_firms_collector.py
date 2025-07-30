"""
NASA FIRMS Data Collector
Location: backend/data_pipeline/nasa_firms_collector.py
"""

import aiohttp
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta
import asyncio

logger = logging.getLogger(__name__)


class NASAFIRMSCollector:
    """Collects fire data from NASA FIRMS API"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://firms.modaps.eosdis.nasa.gov/api/area"
        self.session = None
        self._is_healthy = False

    async def initialize(self):
        """Initialize the collector"""
        self.session = aiohttp.ClientSession()
        self._is_healthy = True
        logger.info("NASA FIRMS collector initialized")

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
            # Format dates for API
            date_format = "%Y-%m-%d"

            # Build API parameters
            params = {
                'source': 'modis',
                'country': 'USA',
                'date': f"{start_date.strftime(date_format)},{end_date.strftime(date_format)}",
                'format': 'json'
            }

            # Add bounds
            url = f"{self.base_url}/csv/{self.api_key}/MODIS_NRT/{bounds['west']},{bounds['south']},{bounds['east']},{bounds['north']}/1"

            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()

                    # Filter by confidence
                    active_fires = []
                    for fire in data:
                        if float(fire.get('confidence', 0)) >= confidence_threshold * 100:
                            active_fires.append({
                                'latitude': float(fire['latitude']),
                                'longitude': float(fire['longitude']),
                                'brightness_temperature': float(fire.get('brightness', 0)),
                                'frp': float(fire.get('frp', 0)),
                                'confidence': float(fire.get('confidence', 0)) / 100,
                                'detection_time': fire.get('acq_date') + 'T' + fire.get('acq_time', '00:00'),
                                'satellite': fire.get('satellite', 'MODIS')
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
                    # Return empty data instead of mock
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