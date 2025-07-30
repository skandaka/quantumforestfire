"""
NOAA Weather Data Collector
Location: backend/data_pipeline/noaa_weather_collector.py
"""

import aiohttp
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np
import json

logger = logging.getLogger(__name__)


class NOAAWeatherCollector:
    """Collects weather data from NOAA API"""

    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.weather.gov"
        self.session = None
        self._is_healthy = False

    async def initialize(self):
        """Initialize the collector"""
        self.session = aiohttp.ClientSession(
            headers={'User-Agent': 'QuantumFirePrediction/1.0'}
        )
        self._is_healthy = True
        logger.info("NOAA Weather collector initialized")

    def is_healthy(self) -> bool:
        """Check if collector is healthy"""
        return self._is_healthy and self.session is not None

    async def get_weather_data(
        self,
        bounds: Dict[str, float],
        forecast_days: int = 5
    ) -> Dict[str, Any]:
        """Get weather data from NOAA"""
        try:
            # Get weather stations in the area
            stations = await self._get_stations_in_bounds(bounds)

            weather_data = {
                'stations': [],
                'current_conditions': {},
                'metadata': {
                    'source': 'NOAA',
                    'collection_time': datetime.now().isoformat()
                }
            }

            # Collect data from each station
            for station in stations[:10]:  # Limit to 10 stations
                station_data = await self._get_station_observations(station['properties']['stationIdentifier'])
                if station_data:
                    weather_data['stations'].append(station_data)

            # Calculate averages
            if weather_data['stations']:
                temps = [s['temperature'] for s in weather_data['stations'] if s.get('temperature') is not None]
                humidities = [s['humidity'] for s in weather_data['stations'] if s.get('humidity') is not None]
                wind_speeds = [s['wind_speed'] for s in weather_data['stations'] if s.get('wind_speed') is not None]

                weather_data['current_conditions'] = {
                    'avg_temperature': np.mean(temps) if temps else 20,
                    'avg_humidity': np.mean(humidities) if humidities else 50,
                    'avg_wind_speed': np.mean(wind_speeds) if wind_speeds else 10,
                    'max_wind_speed': max(wind_speeds) if wind_speeds else 15,
                    'dominant_wind_direction': 0  # Would need more complex calculation
                }

            return weather_data

        except Exception as e:
            logger.error(f"Error collecting NOAA data: {str(e)}")
            self._is_healthy = False
            # Return minimal data structure
            return {
                'stations': [],
                'current_conditions': {
                    'avg_temperature': 20,
                    'avg_humidity': 50,
                    'avg_wind_speed': 10,
                    'max_wind_speed': 15,
                    'dominant_wind_direction': 0
                },
                'metadata': {
                    'source': 'NOAA',
                    'collection_time': datetime.now().isoformat(),
                    'error': str(e)
                }
            }

    async def _get_stations_in_bounds(self, bounds: Dict[str, float]) -> List[Dict[str, Any]]:
        """Get weather stations within bounds"""
        try:
            # Get grid points for the bounds
            points_url = f"{self.base_url}/points/{(bounds['north']+bounds['south'])/2},{(bounds['east']+bounds['west'])/2}"

            async with self.session.get(points_url) as response:
                if response.status == 200:
                    data = await response.json()

                    # Get stations from the forecast office
                    if 'properties' in data:
                        stations_url = f"{self.base_url}/gridpoints/{data['properties']['gridId']}/{data['properties']['gridX']},{data['properties']['gridY']}/stations"

                        async with self.session.get(stations_url) as stations_response:
                            if stations_response.status == 200:
                                stations_data = await stations_response.json()
                                return stations_data.get('features', [])

            return []

        except Exception as e:
            logger.error(f"Error getting stations: {str(e)}")
            return []

    async def _get_station_observations(self, station_id: str) -> Optional[Dict[str, Any]]:
        """Get latest observations from a station"""
        try:
            url = f"{self.base_url}/stations/{station_id}/observations/latest"

            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    props = data.get('properties', {})

                    # Extract relevant data
                    return {
                        'station_id': station_id,
                        'latitude': data.get('geometry', {}).get('coordinates', [0, 0])[1],
                        'longitude': data.get('geometry', {}).get('coordinates', [0, 0])[0],
                        'temperature': props.get('temperature', {}).get('value'),
                        'humidity': props.get('relativeHumidity', {}).get('value'),
                        'wind_speed': self._convert_wind_speed(props.get('windSpeed', {}).get('value')),
                        'wind_direction': props.get('windDirection', {}).get('value'),
                        'pressure': props.get('barometricPressure', {}).get('value')
                    }

            return None

        except Exception as e:
            logger.error(f"Error getting station observations: {str(e)}")
            return None

    def _convert_wind_speed(self, speed_ms: Optional[float]) -> Optional[float]:
        """Convert wind speed from m/s to mph"""
        if speed_ms is not None:
            return speed_ms * 2.237
        return None

    async def get_fire_weather_data(self, bounds: Dict[str, float]) -> Dict[str, Any]:
        """Get specialized fire weather data"""
        # This would integrate with NOAA's fire weather products
        # For now, return calculated values based on current conditions
        weather = await self.get_weather_data(bounds)

        return {
            'temperature_850mb': weather['current_conditions'].get('avg_temperature', 20) - 5,
            'dewpoint_850mb': weather['current_conditions'].get('avg_temperature', 20) - 10,
            'wind_speed': weather['current_conditions'].get('avg_wind_speed', 10),
            'fuel_moisture': 100 - weather['current_conditions'].get('avg_humidity', 50)
        }

    async def get_wind_field(
        self,
        bounds: Dict[str, float],
        heights: List[int]
    ) -> np.ndarray:
        """Get 3D wind field data"""
        # Real implementation would use NOAA's wind profile data
        # For now, create a realistic wind field based on surface observations
        weather = await self.get_weather_data(bounds)

        base_speed = weather['current_conditions'].get('avg_wind_speed', 10)
        base_direction = weather['current_conditions'].get('dominant_wind_direction', 0)

        # Create 3D wind field with height variation
        wind_field = np.zeros((len(heights), 10, 10, 3))

        for i, height in enumerate(heights):
            # Wind speed increases with height (power law)
            speed = base_speed * (height / 10) ** 0.2
            direction_rad = np.deg2rad(base_direction)

            # Fill grid
            wind_field[i, :, :, 0] = speed * np.cos(direction_rad)
            wind_field[i, :, :, 1] = speed * np.sin(direction_rad)
            wind_field[i, :, :, 2] = 0  # Vertical component

        return wind_field

    async def shutdown(self):
        """Shutdown the collector"""
        if self.session:
            await self.session.close()
        self._is_healthy = False
        logger.info("NOAA Weather collector shutdown")