# backend/data_pipeline/openmeteo_weather_collector.py
"""
Open-Meteo Weather Data Collector for Quantum Fire Prediction
Robust implementation with error handling and retry logic
"""

import aiohttp
import asyncio
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from tenacity import retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)


class OpenMeteoWeatherCollector:
    """Industrial-grade weather data collector using Open-Meteo API"""

    def __init__(self):
        self.base_url = "https://api.open-meteo.com/v1/forecast"
        self.session: Optional[aiohttp.ClientSession] = None
        self._is_healthy = True
        self.last_error: Optional[str] = None
        self.collection_stats = {
            'successful_collections': 0,
            'failed_collections': 0,
            'last_collection_time': None,
            'average_response_time': 0
        }

    async def initialize(self):
        """Initialize the collector with connection pooling"""
        connector = aiohttp.TCPConnector(
            limit=100,
            ttl_dns_cache=300,
            enable_cleanup_closed=True
        )
        timeout = aiohttp.ClientTimeout(total=30, connect=10)

        self.session = aiohttp.ClientSession(
            connector=connector,
            timeout=timeout,
            headers={'User-Agent': 'QuantumFirePrediction/1.0'}
        )
        logger.info("Open-Meteo weather collector initialized")

    async def shutdown(self):
        """Gracefully shutdown the collector"""
        if self.session:
            await self.session.close()
        logger.info("Open-Meteo weather collector shutdown")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10)
    )
    async def get_weather_data(
            self,
            bounds: Dict[str, float],
            forecast_days: int = 5,
            grid_resolution: float = 0.1  # degrees
    ) -> Dict[str, Any]:
        """
        Get comprehensive weather data for wildfire prediction

        Args:
            bounds: Geographic bounds (north, south, east, west)
            forecast_days: Number of forecast days (max 16)
            grid_resolution: Grid resolution in degrees

        Returns:
            Processed weather data optimized for quantum models
        """
        start_time = datetime.now()

        try:
            # Generate grid points for the area
            grid_points = self._generate_grid_points(bounds, grid_resolution)

            # Collect data for all grid points (parallel requests)
            weather_tasks = []
            for lat, lon in grid_points:
                task = self._fetch_point_weather(lat, lon, forecast_days)
                weather_tasks.append(task)

            # Batch requests to avoid overwhelming the API
            batch_size = 20
            all_weather_data = []

            for i in range(0, len(weather_tasks), batch_size):
                batch = weather_tasks[i:i + batch_size]
                batch_results = await asyncio.gather(*batch, return_exceptions=True)

                # Filter out failed requests
                valid_results = [r for r in batch_results if not isinstance(r, Exception)]
                all_weather_data.extend(valid_results)

                # Small delay between batches
                if i + batch_size < len(weather_tasks):
                    await asyncio.sleep(0.1)

            # Process and aggregate the data
            processed_data = await self._process_weather_data(all_weather_data, bounds)

            # Update statistics
            duration = (datetime.now() - start_time).total_seconds()
            self._update_stats(success=True, duration=duration)

            return processed_data

        except Exception as e:
            logger.error(f"Error collecting weather data: {str(e)}")
            self._update_stats(success=False)
            self.last_error = str(e)
            self._is_healthy = False
            raise

    async def _fetch_point_weather(
            self,
            latitude: float,
            longitude: float,
            forecast_days: int
    ) -> Dict[str, Any]:
        """Fetch weather data for a single point"""

        # Critical weather variables for fire prediction
        hourly_vars = [
            "temperature_2m",
            "relative_humidity_2m",
            "precipitation",
            "windspeed_10m",
            "winddirection_10m",
            "windgusts_10m",
            "surface_pressure",
            "cloudcover",
            "direct_radiation",
            "terrestrial_radiation",
            "vapor_pressure_deficit",
            "et0_fao_evapotranspiration",
            "temperature_850hPa",  # For atmospheric stability
            "geopotential_height_850hPa"
        ]

        params = {
            'latitude': latitude,
            'longitude': longitude,
            'hourly': ','.join(hourly_vars),
            'forecast_days': min(forecast_days, 16),
            'temperature_unit': 'celsius',
            'windspeed_unit': 'mph',
            'precipitation_unit': 'mm',
            'timezone': 'UTC'
        }

        async with self.session.get(self.base_url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return self._parse_weather_response(data)
            else:
                raise Exception(f"API returned status {response.status}")

    def _parse_weather_response(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Parse Open-Meteo response into structured format"""

        hourly = data.get('hourly', {})

        # Extract current conditions (first hour)
        current_idx = 0
        current_conditions = {
            'temperature': hourly.get('temperature_2m', [None])[current_idx],
            'humidity': hourly.get('relative_humidity_2m', [None])[current_idx],
            'wind_speed': hourly.get('windspeed_10m', [None])[current_idx],
            'wind_direction': hourly.get('winddirection_10m', [None])[current_idx],
            'wind_gusts': hourly.get('windgusts_10m', [None])[current_idx],
            'pressure': hourly.get('surface_pressure', [None])[current_idx],
            'vapor_pressure_deficit': hourly.get('vapor_pressure_deficit', [None])[current_idx],
        }

        # Calculate fire weather indices
        fire_weather = self._calculate_fire_weather_indices(current_conditions)

        return {
            'latitude': data['latitude'],
            'longitude': data['longitude'],
            'current': current_conditions,
            'fire_weather': fire_weather,
            'hourly': hourly,
            'metadata': {
                'timestamp': datetime.now().isoformat(),
                'timezone': data.get('timezone', 'UTC')
            }
        }

    def _calculate_fire_weather_indices(self, conditions: Dict[str, Any]) -> Dict[str, float]:
        """Calculate critical fire weather indices"""

        temp = conditions.get('temperature', 20)
        humidity = conditions.get('relative_humidity', 50)
        wind_speed = conditions.get('wind_speed', 0)
        vpd = conditions.get('vapor_pressure_deficit', 1)

        # Fosberg Fire Weather Index (simplified)
        # Range: 0-100, higher = more dangerous
        if humidity > 0:
            moisture_damping = 1 - (2 * (humidity / 100) +
                                    (3 * (humidity / 100) ** 2) -
                                    (humidity / 100) ** 3)
        else:
            moisture_damping = 1

        wind_factor = np.sqrt(1 + wind_speed ** 2)
        ffwi = moisture_damping * wind_factor * 10

        # Chandler Burning Index
        # Incorporates temperature and humidity
        cbi = (((110 - 1.373 * humidity) - 0.54 * (10.20 - temp)) *
               (124 * (10 ** (-0.0142 * humidity))) / 60)

        # Hot-Dry-Windy Index
        hdw = (vpd * wind_speed) / 10 if vpd > 0 else 0

        return {
            'fosberg_index': min(ffwi, 100),
            'chandler_burning_index': max(0, cbi),
            'hot_dry_windy_index': hdw,
            'red_flag_warning': self._check_red_flag_conditions(conditions)
        }

    def _check_red_flag_conditions(self, conditions: Dict[str, Any]) -> bool:
        """Check for Red Flag Warning conditions"""
        # Based on National Weather Service criteria
        humidity = conditions.get('relative_humidity', 100)
        wind_speed = conditions.get('wind_speed', 0)
        wind_gusts = conditions.get('wind_gusts', 0)

        return (humidity <= 15 and wind_speed >= 25) or wind_gusts >= 35

    def _generate_grid_points(
            self,
            bounds: Dict[str, float],
            resolution: float
    ) -> List[Tuple[float, float]]:
        """Generate grid points within bounds"""

        lat_steps = int((bounds['north'] - bounds['south']) / resolution) + 1
        lon_steps = int((bounds['east'] - bounds['west']) / resolution) + 1

        # Limit grid size to prevent too many requests
        max_points = 100
        if lat_steps * lon_steps > max_points:
            # Adjust resolution
            total_area = (bounds['north'] - bounds['south']) * (bounds['east'] - bounds['west'])
            resolution = np.sqrt(total_area / max_points)
            lat_steps = int((bounds['north'] - bounds['south']) / resolution) + 1
            lon_steps = int((bounds['east'] - bounds['west']) / resolution) + 1

        grid_points = []
        for i in range(lat_steps):
            for j in range(lon_steps):
                lat = bounds['south'] + i * resolution
                lon = bounds['west'] + j * resolution
                if lat <= bounds['north'] and lon <= bounds['east']:
                    grid_points.append((lat, lon))

        return grid_points

    async def _process_weather_data(
            self,
            point_data: List[Dict[str, Any]],
            bounds: Dict[str, float]
    ) -> Dict[str, Any]:
        """Process and aggregate weather data for quantum models"""

        if not point_data:
            raise ValueError("No weather data collected")

        # Extract current conditions from all points
        stations = []
        for data in point_data:
            if data.get('current'):
                station = {
                    'latitude': data['latitude'],
                    'longitude': data['longitude'],
                    **data['current']
                }
                stations.append(station)

        # Create wind field matrix for quantum model
        wind_field = self._create_wind_field(stations, bounds)

        # Create temperature and humidity fields
        temp_field = self._create_scalar_field(stations, bounds, 'temperature')
        humidity_field = self._create_scalar_field(stations, bounds, 'humidity')

        # Aggregate fire weather indices
        fire_weather_stats = self._aggregate_fire_weather(point_data)

        return {
            'stations': stations,
            'current_conditions': self._calculate_area_statistics(stations),
            'wind_field': wind_field,
            'temperature_field': temp_field,
            'humidity_field': humidity_field,
            'fire_weather': fire_weather_stats,
            'high_risk_areas': self._identify_high_risk_areas(point_data),
            'metadata': {
                'source': 'Open-Meteo',
                'collection_time': datetime.now().isoformat(),
                'points_collected': len(point_data),
                'bounds': bounds
            }
        }

    def _create_wind_field(
            self,
            stations: List[Dict[str, Any]],
            bounds: Dict[str, float],
            grid_size: int = 50
    ) -> np.ndarray:
        """Create wind vector field for quantum model"""

        # Initialize grid
        wind_field = np.zeros((grid_size, grid_size, 2))

        if not stations:
            return wind_field

        # Create interpolation grid
        lat_range = np.linspace(bounds['south'], bounds['north'], grid_size)
        lon_range = np.linspace(bounds['west'], bounds['east'], grid_size)

        # Simple inverse distance weighting interpolation
        for i, lat in enumerate(lat_range):
            for j, lon in enumerate(lon_range):
                # Calculate weighted average from all stations
                total_weight = 0
                u_component = 0
                v_component = 0

                for station in stations:
                    if station.get('wind_speed') is not None and station.get('wind_direction') is not None:
                        # Calculate distance
                        dist = np.sqrt((lat - station['latitude']) ** 2 + (lon - station['longitude']) ** 2)

                        # Inverse distance weight (avoid division by zero)
                        weight = 1 / (dist + 0.01)

                        # Convert wind to u,v components
                        wind_rad = np.radians(station['wind_direction'])
                        u = station['wind_speed'] * np.sin(wind_rad)
                        v = station['wind_speed'] * np.cos(wind_rad)

                        u_component += u * weight
                        v_component += v * weight
                        total_weight += weight

                if total_weight > 0:
                    wind_field[i, j, 0] = u_component / total_weight
                    wind_field[i, j, 1] = v_component / total_weight

        return wind_field

    def _create_scalar_field(
            self,
            stations: List[Dict[str, Any]],
            bounds: Dict[str, float],
            variable: str,
            grid_size: int = 50
    ) -> np.ndarray:
        """Create scalar field (temperature, humidity, etc.)"""

        field = np.zeros((grid_size, grid_size))

        if not stations:
            return field

        lat_range = np.linspace(bounds['south'], bounds['north'], grid_size)
        lon_range = np.linspace(bounds['west'], bounds['east'], grid_size)

        for i, lat in enumerate(lat_range):
            for j, lon in enumerate(lon_range):
                total_weight = 0
                weighted_sum = 0

                for station in stations:
                    if station.get(variable) is not None:
                        dist = np.sqrt((lat - station['latitude']) ** 2 + (lon - station['longitude']) ** 2)
                        weight = 1 / (dist + 0.01)
                        weighted_sum += station[variable] * weight
                        total_weight += weight

                if total_weight > 0:
                    field[i, j] = weighted_sum / total_weight

        return field

    def _aggregate_fire_weather(self, point_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Aggregate fire weather indices across the area"""

        indices = {
            'fosberg_index': [],
            'chandler_burning_index': [],
            'hot_dry_windy_index': [],
            'red_flag_warnings': 0
        }

        for data in point_data:
            if 'fire_weather' in data:
                fw = data['fire_weather']
                indices['fosberg_index'].append(fw.get('fosberg_index', 0))
                indices['chandler_burning_index'].append(fw.get('chandler_burning_index', 0))
                indices['hot_dry_windy_index'].append(fw.get('hot_dry_windy_index', 0))
                if fw.get('red_flag_warning', False):
                    indices['red_flag_warnings'] += 1

        return {
            'max_fosberg': max(indices['fosberg_index']) if indices['fosberg_index'] else 0,
            'avg_fosberg': np.mean(indices['fosberg_index']) if indices['fosberg_index'] else 0,
            'max_cbi': max(indices['chandler_burning_index']) if indices['chandler_burning_index'] else 0,
            'max_hdw': max(indices['hot_dry_windy_index']) if indices['hot_dry_windy_index'] else 0,
            'red_flag_warning_count': indices['red_flag_warnings'],
            'red_flag_percentage': (indices['red_flag_warnings'] / len(point_data) * 100) if point_data else 0
        }

    def _identify_high_risk_areas(self, point_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify areas with high fire risk"""

        high_risk_areas = []

        for data in point_data:
            if 'fire_weather' in data:
                fw = data['fire_weather']

                # Define high risk criteria
                is_high_risk = (
                        fw.get('fosberg_index', 0) > 50 or
                        fw.get('chandler_burning_index', 0) > 90 or
                        fw.get('hot_dry_windy_index', 0) > 10 or
                        fw.get('red_flag_warning', False)
                )

                if is_high_risk:
                    high_risk_areas.append({
                        'latitude': data['latitude'],
                        'longitude': data['longitude'],
                        'risk_factors': {
                            'fosberg_index': fw.get('fosberg_index', 0),
                            'cbi': fw.get('chandler_burning_index', 0),
                            'hdw': fw.get('hot_dry_windy_index', 0),
                            'red_flag': fw.get('red_flag_warning', False)
                        },
                        'risk_level': self._calculate_risk_level(fw)
                    })

        return high_risk_areas

    def _calculate_risk_level(self, fire_weather: Dict[str, Any]) -> str:
        """Calculate overall risk level"""

        score = 0

        # Fosberg Index contribution
        fosberg = fire_weather.get('fosberg_index', 0)
        if fosberg > 75:
            score += 3
        elif fosberg > 50:
            score += 2
        elif fosberg > 25:
            score += 1

        # CBI contribution
        cbi = fire_weather.get('chandler_burning_index', 0)
        if cbi > 100:
            score += 3
        elif cbi > 75:
            score += 2
        elif cbi > 50:
            score += 1

        # HDW contribution
        hdw = fire_weather.get('hot_dry_windy_index', 0)
        if hdw > 15:
            score += 3
        elif hdw > 10:
            score += 2
        elif hdw > 5:
            score += 1

        # Red flag warning
        if fire_weather.get('red_flag_warning', False):
            score += 2

        # Determine risk level
        if score >= 8:
            return 'extreme'
        elif score >= 6:
            return 'very_high'
        elif score >= 4:
            return 'high'
        elif score >= 2:
            return 'moderate'
        else:
            return 'low'

    def _calculate_area_statistics(self, stations: List[Dict[str, Any]]) -> Dict[str, float]:
        """Calculate area-wide statistics"""

        if not stations:
            return {
                'avg_temperature': 20,
                'avg_humidity': 50,
                'avg_wind_speed': 5,
                'max_wind_speed': 10,
                'dominant_wind_direction': 0
            }

        temps = [s.get('temperature', 20) for s in stations if s.get('temperature') is not None]
        humidities = [s.get('humidity', 50) for s in stations if s.get('humidity') is not None]
        wind_speeds = [s.get('wind_speed', 0) for s in stations if s.get('wind_speed') is not None]

        # Calculate dominant wind direction using vector averaging
        wind_u = []
        wind_v = []
        for s in stations:
            if s.get('wind_speed') is not None and s.get('wind_direction') is not None:
                rad = np.radians(s['wind_direction'])
                wind_u.append(s['wind_speed'] * np.sin(rad))
                wind_v.append(s['wind_speed'] * np.cos(rad))

        if wind_u and wind_v:
            avg_u = np.mean(wind_u)
            avg_v = np.mean(wind_v)
            dominant_direction = np.degrees(np.arctan2(avg_u, avg_v)) % 360
        else:
            dominant_direction = 0

        return {
            'avg_temperature': np.mean(temps) if temps else 20,
            'avg_humidity': np.mean(humidities) if humidities else 50,
            'avg_wind_speed': np.mean(wind_speeds) if wind_speeds else 5,
            'max_wind_speed': max(wind_speeds) if wind_speeds else 10,
            'dominant_wind_direction': dominant_direction
        }

    def _update_stats(self, success: bool, duration: float = 0):
        """Update collection statistics"""

        if success:
            self.collection_stats['successful_collections'] += 1

            # Update average response time
            prev_avg = self.collection_stats['average_response_time']
            prev_count = self.collection_stats['successful_collections'] - 1

            if prev_count > 0:
                new_avg = (prev_avg * prev_count + duration) / self.collection_stats['successful_collections']
                self.collection_stats['average_response_time'] = new_avg
            else:
                self.collection_stats['average_response_time'] = duration

        else:
            self.collection_stats['failed_collections'] += 1

        self.collection_stats['last_collection_time'] = datetime.now().isoformat()

    async def get_forecast_ensemble(
            self,
            latitude: float,
            longitude: float,
            models: List[str] = None
    ) -> Dict[str, Any]:
        """Get ensemble forecast from multiple weather models"""

        if models is None:
            models = [
                "best_match",  # Auto-select best model
                "gfs_global",  # Global Forecast System
                "ecmwf_ifs04",  # European model
                "gem_global",  # Canadian model
                "icon_global"  # German model
            ]

        ensemble_data = []

        for model in models:
            try:
                # Fetch model-specific forecast
                url = f"https://api.open-meteo.com/v1/{model}"
                params = {
                    'latitude': latitude,
                    'longitude': longitude,
                    'hourly': 'temperature_2m,windspeed_10m,relative_humidity_2m',
                    'forecast_days': 5
                }

                async with self.session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        ensemble_data.append({
                            'model': model,
                            'data': data
                        })

            except Exception as e:
                logger.warning(f"Failed to fetch {model} forecast: {str(e)}")
                continue

        return {
            'ensemble_members': len(ensemble_data),
            'models': [e['model'] for e in ensemble_data],
            'forecasts': ensemble_data,
            'metadata': {
                'location': {'latitude': latitude, 'longitude': longitude},
                'timestamp': datetime.now().isoformat()
            }
        }

    def is_healthy(self) -> bool:
        """Check collector health status"""
        return (
                self._is_healthy and
                self.session is not None and
                not self.session.closed
        )

    def get_stats(self) -> Dict[str, Any]:
        """Get collector statistics"""
        return {
            'health': self.is_healthy(),
            'last_error': self.last_error,
            **self.collection_stats
        }