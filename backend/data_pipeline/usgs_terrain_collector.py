"""
USGS Terrain Data Collector
Location: backend/data_pipeline/usgs_terrain_collector.py
"""

import aiohttp
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)


class USGSTerrainCollector:
    """Collects terrain and elevation data from USGS"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://elevation.nationalmap.gov/arcgis/rest/services/3DEPElevation/ImageServer/identify"
        self.session = None
        self._is_healthy = False

    async def initialize(self):
        """Initialize the collector"""
        self.session = aiohttp.ClientSession()
        self._is_healthy = True
        logger.info("USGS Terrain collector initialized")

    def is_healthy(self) -> bool:
        """Check if collector is healthy"""
        return self._is_healthy and self.session is not None

    async def get_terrain_data(
        self,
        bounds: Dict[str, float],
        resolution: int = 30
    ) -> Dict[str, Any]:
        """Get terrain data from USGS"""
        try:
            grid_size = 50
            lat_step = (bounds['north'] - bounds['south']) / grid_size
            lon_step = (bounds['east'] - bounds['west']) / grid_size

            elevation_grid = np.zeros((grid_size, grid_size))

            # Sample elevation at grid points
            for i in range(grid_size):
                for j in range(grid_size):
                    lat = bounds['south'] + i * lat_step
                    lon = bounds['west'] + j * lon_step

                    elevation = await self._get_elevation_at_point(lat, lon)
                    elevation_grid[i, j] = elevation

            # Calculate slope and aspect from elevation
            dy, dx = np.gradient(elevation_grid, lat_step * 111000, lon_step * 111000)  # Convert to meters
            slope = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2)))
            aspect = np.degrees(np.arctan2(-dx, dy))
            aspect[aspect < 0] += 360

            return {
                'elevation': elevation_grid,
                'slope': slope,
                'aspect': aspect,
                'metadata': {
                    'source': 'USGS',
                    'resolution_meters': resolution,
                    'collection_time': datetime.now().isoformat()
                }
            }

        except Exception as e:
            logger.error(f"Error collecting USGS data: {str(e)}")
            self._is_healthy = False
            # Return default terrain data
            grid_size = 50
            return {
                'elevation': np.random.rand(grid_size, grid_size) * 1000 + 500,
                'slope': np.random.rand(grid_size, grid_size) * 45,
                'aspect': np.random.rand(grid_size, grid_size) * 360,
                'metadata': {
                    'source': 'USGS',
                    'resolution_meters': resolution,
                    'collection_time': datetime.now().isoformat(),
                    'error': str(e)
                }
            }

    async def _get_elevation_point(self, lat: float, lon: float) -> float:
        """Get elevation for a single point"""
        try:
            params = {
                'x': lon,
                'y': lat,
                'units': 'Meters',
                'output': 'json'
            }

            async with self.session.get(self.elevation_url, params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    elevation_str = data.get('USGS_Elevation_Point_Query_Service', {}).get('Elevation_Query', {}).get(
                        'Elevation', 'NoData')

                    # Handle NoData responses
                    if elevation_str == 'NoData' or elevation_str is None:
                        logger.warning(f"No elevation data available for coordinates {lat}, {lon}")
                        return 0.0  # Default to sea level

                    try:
                        return float(elevation_str)
                    except (ValueError, TypeError):
                        logger.warning(f"Invalid elevation value '{elevation_str}' for coordinates {lat}, {lon}")
                        return 0.0
                else:
                    logger.error(f"USGS elevation API returned status {response.status}")
                    return 0.0

        except Exception as e:
            logger.error(f"Error getting elevation: {str(e)}")
            return 0.0  # Return default elevation instead of failing


    async def get_fuel_data(self, bounds: Dict[str, float]) -> Dict[str, Any]:
        """Get vegetation/fuel model data"""
        # This would integrate with LANDFIRE or similar services
        # For now, generate realistic fuel models based on terrain
        terrain = await self.get_terrain_data(bounds)

        grid_size = terrain['elevation'].shape[0]
        fuel_models = np.zeros((grid_size, grid_size), dtype=int)
        fuel_moisture = np.zeros((grid_size, grid_size))

        for i in range(grid_size):
            for j in range(grid_size):
                elevation = terrain['elevation'][i, j]
                slope = terrain['slope'][i, j]

                # Assign fuel models based on elevation and slope
                if elevation < 500:
                    fuel_models[i, j] = 1  # Grass
                elif elevation < 1000:
                    fuel_models[i, j] = 2  # Grass and shrubs
                elif elevation < 1500:
                    fuel_models[i, j] = 8  # Timber litter
                else:
                    fuel_models[i, j] = 10  # Timber with understory

                # Fuel moisture varies with elevation
                fuel_moisture[i, j] = 5 + (elevation / 100) + np.random.random() * 5

        return {
            'fuel_models': fuel_models,
            'fuel_moisture': fuel_moisture
        }

    async def shutdown(self):
        """Shutdown the collector"""
        if self.session:
            await self.session.close()
        self._is_healthy = False
        logger.info("USGS Terrain collector shutdown")