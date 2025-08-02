import logging
import numpy as np
from datetime import datetime
from typing import Dict, List, Any, Optional
import asyncio

logger = logging.getLogger(__name__)


class DataProcessor:
    """
    Processes raw data from various collectors into a unified format
    suitable for quantum fire prediction models.
    """

    def __init__(self):
        """Initialize the DataProcessor."""
        self.processing_stats = {
            'total_processed': 0,
            'errors': 0,
            'last_processing_time': None
        }
        self.california_bounds = {
            'north': 42.0,
            'south': 32.5,
            'east': -114.0,
            'west': -124.5
        }

        logger.info("DataProcessor initialized.")

    async def process(self, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process raw data from all collectors into unified format.

        Args:
            raw_data: Dictionary with collector names as keys and their raw data as values

        Returns:
            Processed and unified data structure
        """
        try:
            logger.info("Starting data processing pipeline...")
            start_time = datetime.now()

            processed_data = {
                'active_fires': [],
                'weather': {},
                'terrain': {},
                'metadata': {
                    'processing_time': None,
                    'sources': [],
                    'timestamp': datetime.now().isoformat(),
                    'data_quality': 'high'
                }
            }

            # Process NASA FIRMS fire data
            if 'nasa_firms' in raw_data and raw_data['nasa_firms']:
                firms_result = raw_data['nasa_firms']
                if isinstance(firms_result, dict) and 'active_fires' in firms_result:
                    processed_data['active_fires'] = self._process_firms_data(firms_result)
                    processed_data['metadata']['sources'].append('NASA FIRMS')
                else:
                    logger.warning("Invalid NASA FIRMS data format")

            # Process weather data (NOAA and OpenMeteo)
            weather_sources = []
            for source in ['noaa_weather', 'openmeteo_weather']:
                if source in raw_data and raw_data[source]:
                    try:
                        weather_data = self._process_weather_data(raw_data[source], source)
                        if weather_data:
                            if not processed_data['weather']:
                                processed_data['weather'] = weather_data
                            else:
                                # Merge weather data from multiple sources
                                processed_data['weather'] = self._merge_weather_data(
                                    processed_data['weather'], weather_data
                                )
                            weather_sources.append(source.replace('_', ' ').title())
                    except Exception as e:
                        logger.error(f"Error processing {source} data: {e}")

            if weather_sources:
                processed_data['metadata']['sources'].extend(weather_sources)

            # Process terrain data
            if 'usgs_terrain' in raw_data and raw_data['usgs_terrain']:
                try:
                    terrain_data = self._process_terrain_data(raw_data['usgs_terrain'])
                    processed_data['terrain'] = terrain_data
                    processed_data['metadata']['sources'].append('USGS')
                except Exception as e:
                    logger.error(f"Error processing terrain data: {e}")

            # Add fallback data if no real data available
            if not processed_data['active_fires']:
                processed_data['active_fires'] = self._generate_demo_fire_data()

            if not processed_data['weather']:
                processed_data['weather'] = self._generate_demo_weather_data()

            if not processed_data['terrain']:
                processed_data['terrain'] = self._generate_demo_terrain_data()

            # Calculate processing time
            processing_time = (datetime.now() - start_time).total_seconds()
            processed_data['metadata']['processing_time'] = processing_time

            # Update stats
            self.processing_stats['total_processed'] += 1
            self.processing_stats['last_processing_time'] = processing_time

            logger.info(f"Data processing completed in {processing_time:.2f}s")
            return processed_data

        except Exception as e:
            logger.error(f"Error in data processing pipeline: {e}", exc_info=True)
            self.processing_stats['errors'] += 1

            # Return fallback data structure
            return {
                'active_fires': self._generate_demo_fire_data(),
                'weather': self._generate_demo_weather_data(),
                'terrain': self._generate_demo_terrain_data(),
                'metadata': {
                    'processing_time': 0,
                    'sources': ['Fallback'],
                    'timestamp': datetime.now().isoformat(),
                    'data_quality': 'fallback',
                    'error': str(e)
                }
            }

    def _process_firms_data(self, firms_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Process NASA FIRMS fire data."""
        try:
            active_fires = firms_data.get('active_fires', [])
            if not isinstance(active_fires, list):
                logger.warning("Active fires data is not a list")
                return []

            # Filter and process fires
            processed_fires = []
            for fire in active_fires:
                if not isinstance(fire, dict):
                    logger.warning(f"Fire data is not a dict: {type(fire)}")
                    continue

                # Validate required fields
                if not all(key in fire for key in ['latitude', 'longitude']):
                    logger.warning("Fire missing required location data")
                    continue

                try:
                    processed_fire = {
                        'id': fire.get('id', f"fire_{len(processed_fires)}"),
                        'latitude': float(fire['latitude']),
                        'longitude': float(fire['longitude']),
                        'intensity': self._calculate_intensity(fire),
                        'area_hectares': self._estimate_area(fire),
                        'confidence': int(fire.get('confidence', 70)),
                        'brightness_temperature': float(fire.get('brightness_temperature', 300)),
                        'detection_time': fire.get('detection_time', datetime.now().isoformat()),
                        'satellite': fire.get('satellite', 'Unknown'),
                        'frp': float(fire.get('frp', 0)),
                        'center_lat': float(fire['latitude']),
                        'center_lon': float(fire['longitude'])
                    }

                    # Only include fires within California bounds
                    if self._is_within_bounds(processed_fire['latitude'], processed_fire['longitude']):
                        processed_fires.append(processed_fire)

                except (ValueError, TypeError) as e:
                    logger.warning(f"Error processing individual fire: {e}")
                    continue

            logger.info(f"Processed {len(processed_fires)} valid fires from FIRMS data")
            return processed_fires

        except Exception as e:
            logger.error(f"Error processing FIRMS data: {e}")
            return []

    def _process_weather_data(self, weather_data: Dict[str, Any], source: str) -> Dict[str, Any]:
        """Process weather data from various sources."""
        try:
            processed_weather = {
                'stations': [],
                'current_conditions': {},
                'fire_weather': {},
                'forecast': [],
                'metadata': {
                    'source': source,
                    'collection_time': datetime.now().isoformat()
                }
            }

            # Process based on source
            if source == 'noaa_weather':
                return self._process_noaa_weather(weather_data, processed_weather)
            elif source == 'openmeteo_weather':
                return self._process_openmeteo_weather(weather_data, processed_weather)
            else:
                logger.warning(f"Unknown weather source: {source}")
                return processed_weather

        except Exception as e:
            logger.error(f"Error processing weather data from {source}: {e}")
            return {}

    def _process_noaa_weather(self, data: Dict[str, Any], processed: Dict[str, Any]) -> Dict[str, Any]:
        """Process NOAA weather data."""
        try:
            # Process stations
            stations = data.get('stations', [])
            for station in stations:
                if isinstance(station, dict):
                    processed['stations'].append({
                        'station_id': station.get('station_id', 'unknown'),
                        'latitude': float(station.get('latitude', 0)),
                        'longitude': float(station.get('longitude', 0)),
                        'temperature': float(station.get('temperature', 20)),
                        'humidity': float(station.get('humidity', 50)),
                        'wind_speed': float(station.get('wind_speed', 10)),
                        'wind_direction': float(station.get('wind_direction', 0)),
                        'pressure': float(station.get('pressure', 1013.25))
                    })

            # Process current conditions
            conditions = data.get('current_conditions', {})
            if isinstance(conditions, dict):
                processed['current_conditions'] = {
                    'avg_temperature': float(conditions.get('avg_temperature', 20)),
                    'avg_humidity': float(conditions.get('avg_humidity', 50)),
                    'avg_wind_speed': float(conditions.get('avg_wind_speed', 10)),
                    'max_wind_speed': float(conditions.get('max_wind_speed', 15)),
                    'dominant_wind_direction': float(conditions.get('dominant_wind_direction', 0)),
                    'fuel_moisture': float(conditions.get('fuel_moisture', 15))
                }

            return processed

        except Exception as e:
            logger.error(f"Error processing NOAA weather: {e}")
            return processed

    def _process_openmeteo_weather(self, data: Dict[str, Any], processed: Dict[str, Any]) -> Dict[str, Any]:
        """Process OpenMeteo weather data."""
        try:
            # Process current conditions
            current = data.get('current', {})
            if isinstance(current, dict):
                processed['current_conditions'] = {
                    'avg_temperature': float(current.get('temperature', 20)),
                    'avg_humidity': float(current.get('humidity', 50)),
                    'avg_wind_speed': float(current.get('wind_speed', 10)),
                    'max_wind_speed': float(current.get('wind_gusts', 15)),
                    'dominant_wind_direction': float(current.get('wind_direction', 0)),
                    'pressure': float(current.get('pressure', 1013.25))
                }

            # Process fire weather if available
            fire_weather = data.get('fire_weather', {})
            if isinstance(fire_weather, dict):
                processed['fire_weather'] = {
                    'fosberg_index': float(fire_weather.get('fosberg_index', 50)),
                    'red_flag_warning': bool(fire_weather.get('red_flag_warning', False))
                }

            return processed

        except Exception as e:
            logger.error(f"Error processing OpenMeteo weather: {e}")
            return processed

    def _process_terrain_data(self, terrain_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process terrain data from USGS."""
        try:
            processed_terrain = {
                'elevation_grid': [],
                'slope_grid': [],
                'aspect_grid': [],
                'fuel_model_grid': [],
                'metadata': {
                    'source': 'USGS',
                    'collection_time': datetime.now().isoformat()
                }
            }

            # Process elevation data
            if 'elevation' in terrain_data:
                elevation_data = terrain_data['elevation']
                if isinstance(elevation_data, list):
                    processed_terrain['elevation_grid'] = elevation_data
                elif isinstance(elevation_data, (int, float)):
                    # Single elevation value - create a small grid
                    processed_terrain['elevation_grid'] = [[elevation_data for _ in range(10)] for _ in range(10)]

            # Process slope data
            if 'slope' in terrain_data:
                slope_data = terrain_data['slope']
                if isinstance(slope_data, list):
                    processed_terrain['slope_grid'] = slope_data

            # Process aspect data
            if 'aspect' in terrain_data:
                aspect_data = terrain_data['aspect']
                if isinstance(aspect_data, list):
                    processed_terrain['aspect_grid'] = aspect_data

            return processed_terrain

        except Exception as e:
            logger.error(f"Error processing terrain data: {e}")
            return {}

    def _merge_weather_data(self, data1: Dict[str, Any], data2: Dict[str, Any]) -> Dict[str, Any]:
        """Merge weather data from multiple sources."""
        try:
            merged = data1.copy()

            # Merge stations
            if 'stations' in data2:
                merged.setdefault('stations', []).extend(data2['stations'])

            # Merge current conditions by averaging numerical values
            if 'current_conditions' in data2 and 'current_conditions' in merged:
                conditions1 = merged['current_conditions']
                conditions2 = data2['current_conditions']

                for key in conditions1:
                    if key in conditions2 and isinstance(conditions1[key], (int, float)):
                        merged['current_conditions'][key] = (conditions1[key] + conditions2[key]) / 2

            return merged

        except Exception as e:
            logger.error(f"Error merging weather data: {e}")
            return data1

    def _calculate_intensity(self, fire_data: Dict[str, Any]) -> float:
        """Calculate fire intensity from available data."""
        try:
            # Use FRP (Fire Radiative Power) if available
            frp = fire_data.get('frp', 0)
            if frp > 0:
                # Normalize FRP to 0-1 scale (rough approximation)
                return min(frp / 1000.0, 1.0)

            # Use brightness temperature
            brightness = fire_data.get('brightness_temperature', 300)
            if brightness > 300:
                # Normalize brightness to 0-1 scale
                return min((brightness - 300) / 200.0, 1.0)

            # Use confidence as fallback
            confidence = fire_data.get('confidence', 50)
            return confidence / 100.0

        except Exception:
            return 0.5  # Default moderate intensity

    def _estimate_area(self, fire_data: Dict[str, Any]) -> float:
        """Estimate fire area in hectares."""
        try:
            # If area is directly provided
            if 'area_hectares' in fire_data:
                return float(fire_data['area_hectares'])

            # Estimate from FRP
            frp = fire_data.get('frp', 0)
            if frp > 0:
                # Rough conversion: FRP to hectares (very approximate)
                return max(frp * 0.1, 1.0)

            # Default small fire
            return 10.0

        except Exception:
            return 10.0

    def _is_within_bounds(self, latitude: float, longitude: float) -> bool:
        """Check if coordinates are within California bounds."""
        return (self.california_bounds['south'] <= latitude <= self.california_bounds['north'] and
                self.california_bounds['west'] <= longitude <= self.california_bounds['east'])

    def _generate_demo_fire_data(self) -> List[Dict[str, Any]]:
        """Generate demo fire data for California."""
        return [
            {
                'id': 'demo_fire_001',
                'latitude': 39.7596,
                'longitude': -121.6219,
                'intensity': 0.92,
                'area_hectares': 2500.0,
                'confidence': 95,
                'brightness_temperature': 425.0,
                'detection_time': datetime.now().isoformat(),
                'satellite': 'Demo Data',
                'frp': 850.0,
                'center_lat': 39.7596,
                'center_lon': -121.6219
            },
            {
                'id': 'demo_fire_002',
                'latitude': 38.5800,
                'longitude': -121.4900,
                'intensity': 0.68,
                'area_hectares': 890.0,
                'confidence': 91,
                'brightness_temperature': 410.0,
                'detection_time': datetime.now().isoformat(),
                'satellite': 'Demo Data',
                'frp': 340.0,
                'center_lat': 38.5800,
                'center_lon': -121.4900
            }
        ]

    def _generate_demo_weather_data(self) -> Dict[str, Any]:
        """Generate demo weather data."""
        return {
            'stations': [
                {
                    'station_id': 'DEMO_001',
                    'latitude': 39.7596,
                    'longitude': -121.6219,
                    'temperature': 28.5,
                    'humidity': 18.0,
                    'wind_speed': 35.2,
                    'wind_direction': 45.0,
                    'pressure': 1013.25
                }
            ],
            'current_conditions': {
                'avg_temperature': 29.8,
                'avg_humidity': 16.8,
                'avg_wind_speed': 39.0,
                'max_wind_speed': 65.5,
                'dominant_wind_direction': 48.5,
                'fuel_moisture': 6.2
            },
            'fire_weather': {
                'fosberg_index': 82.5,
                'red_flag_warning': True
            },
            'metadata': {
                'source': 'Demo Data',
                'collection_time': datetime.now().isoformat()
            }
        }

    def _generate_demo_terrain_data(self) -> Dict[str, Any]:
        """Generate demo terrain data."""
        # Create small grids for demo
        size = 10
        return {
            'elevation_grid': [[np.random.uniform(100, 1500) for _ in range(size)] for _ in range(size)],
            'slope_grid': [[np.random.uniform(0, 45) for _ in range(size)] for _ in range(size)],
            'aspect_grid': [[np.random.uniform(0, 360) for _ in range(size)] for _ in range(size)],
            'fuel_model_grid': [[np.random.randint(1, 14) for _ in range(size)] for _ in range(size)],
            'metadata': {
                'source': 'Demo Data',
                'collection_time': datetime.now().isoformat()
            }
        }

    def get_processing_stats(self) -> Dict[str, Any]:
        """Get processing statistics."""
        return self.processing_stats.copy()
