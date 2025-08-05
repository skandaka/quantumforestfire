"""
USGS Terrain Data Collector
Location: backend/data_pipeline/usgs_terrain_collector.py
"""

import aiohttp
import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np
from utils.ssl_helpers import create_verified_session

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
        # Create session with timeout settings
        self.session = await create_verified_session(timeout=30)
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
            api_failures = 0
            max_failures = 10  # Allow some API failures before falling back to simulation

            # Sample elevation at grid points
            for i in range(grid_size):
                for j in range(grid_size):
                    lat = bounds['south'] + i * lat_step
                    lon = bounds['west'] + j * lon_step

                    elevation = await self._get_elevation_at_point(lat, lon)
                    elevation_grid[i, j] = elevation
                    
                    # Track API failures
                    if elevation == 0.0:
                        api_failures += 1
                    
                    # If too many failures, switch to simulated data
                    if api_failures > max_failures:
                        logger.warning("Too many USGS API failures, switching to simulated terrain data")
                        return self._generate_simulated_terrain_data(bounds, grid_size)

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
                    'collection_time': datetime.now().isoformat(),
                    'api_failures': api_failures
                }
            }

        except Exception as e:
            logger.error(f"Error collecting USGS data: {str(e)}")
            self._is_healthy = False
            # Return simulated terrain data
            return self._generate_simulated_terrain_data(bounds, 50)

    def _generate_simulated_terrain_data(self, bounds: Dict[str, float], grid_size: int) -> Dict[str, Any]:
        """Generate realistic simulated terrain data for California"""
        # California terrain characteristics
        base_elevation = 500  # meters
        max_elevation = 3000  # meters for Sierra Nevada
        
        # Create elevation grid with realistic California patterns
        elevation_grid = np.zeros((grid_size, grid_size))
        
        for i in range(grid_size):
            for j in range(grid_size):
                # Distance from coast (west side)
                coast_distance = j / grid_size
                
                # Distance from north (higher elevations in north)
                north_factor = i / grid_size
                
                # Base elevation increases inland and northward
                base = base_elevation + coast_distance * 1500 + north_factor * 500
                
                # Add some randomness for hills and valleys
                noise = np.random.normal(0, 200)
                
                # Simulate mountain ranges (Sierra Nevada pattern)
                if 0.6 < coast_distance < 0.9 and 0.3 < north_factor < 0.8:
                    mountain_height = 2000 * np.sin(j * 0.3) * np.sin(i * 0.2)
                    base += max(0, mountain_height)
                
                elevation_grid[i, j] = max(0, base + noise)
        
        # Calculate slope and aspect
        lat_step = (bounds['north'] - bounds['south']) / grid_size
        lon_step = (bounds['east'] - bounds['west']) / grid_size
        dy, dx = np.gradient(elevation_grid, lat_step * 111000, lon_step * 111000)
        slope = np.degrees(np.arctan(np.sqrt(dx**2 + dy**2)))
        aspect = np.degrees(np.arctan2(-dx, dy))
        aspect[aspect < 0] += 360
        
        return {
            'elevation': elevation_grid,
            'slope': slope,
            'aspect': aspect,
            'metadata': {
                'source': 'USGS_Simulated',
                'resolution_meters': 30,
                'collection_time': datetime.now().isoformat(),
                'note': 'Simulated terrain data due to API issues'
            }
        }

    async def collect(self) -> Dict[str, Any]:
        """Collect terrain data - main entry point for data collection"""
        try:
            # Use default bounds for California region
            bounds = {
                'north': 42.0,
                'south': 32.5,
                'east': -114.0,
                'west': -124.5
            }

            return await self.get_terrain_data(bounds)
        except Exception as e:
            logger.error(f"Error in USGS collect: {str(e)}")
            return {
                'elevation': [],
                'slope': [],
                'aspect': [],
                'metadata': {
                    'source': 'USGS',
                    'collection_time': datetime.now().isoformat(),
                    'error': str(e)
                }
            }


    async def _get_elevation_at_point(self, lat: float, lon: float) -> float:
        """Get elevation for a single point from USGS"""
        try:
            params = {
                'x': lon,
                'y': lat,
                'units': 'Meters',
                'output': 'json'
            }

            # USGS Elevation Point Query Service
            elevation_url = "https://epqs.nationalmap.gov/v1/json"

            async with self.session.get(elevation_url, params=params) as response:
                if response.status == 200:
                    response_text = await response.text()
                    
                    # Check if response is empty
                    if not response_text.strip():
                        logger.warning(f"Empty response from USGS API for {lat}, {lon}")
                        return 0.0
                    
                    try:
                        data = json.loads(response_text)
                    except json.JSONDecodeError as e:
                        logger.warning(f"Invalid JSON response from USGS API for {lat}, {lon}: {response_text[:100]}")
                        return 0.0

                    # Extract elevation value - USGS API format is different
                    if isinstance(data, dict):
                        # Try different possible response formats
                        if 'USGS_Elevation_Point_Query_Service' in data:
                            elevation_query = data['USGS_Elevation_Point_Query_Service']
                            if 'Elevation_Query' in elevation_query:
                                elevation = elevation_query['Elevation_Query'].get('Elevation')
                                if elevation is not None:
                                    try:
                                        return float(elevation)
                                    except (ValueError, TypeError):
                                        logger.warning(f"Invalid elevation value for {lat}, {lon}: {elevation}")
                                        return 0.0
                        
                        # Alternative format
                        elif 'value' in data:
                            try:
                                return float(data['value'])
                            except (ValueError, TypeError):
                                logger.warning(f"Invalid elevation value for {lat}, {lon}")
                                return 0.0
                    
                    logger.warning(f"Unexpected USGS API response format for {lat}, {lon}: {data}")
                    return 0.0
                else:
                    logger.error(f"USGS API returned status {response.status} for {lat}, {lon}")
                    return 0.0

        except asyncio.TimeoutError:
            logger.warning(f"Timeout getting elevation for {lat}, {lon}")
            return 0.0
        except Exception as e:
            logger.warning(f"Error getting elevation for {lat}, {lon}: {str(e)}")
            return 0.0


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