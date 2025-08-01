"""
Real-time Data Feeds Manager for Quantum Fire Prediction System
Location: backend/data_pipeline/real_time_feeds.py
"""

import asyncio
import json
import logging
from collections import defaultdict
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

import numpy as np
import redis.asyncio as redis
from asyncio import Queue
from shapely.geometry import Point

from config import settings
from .data_processor import FireDataProcessor
from .data_validation import DataValidator
from .nasa_firms_collector import NASAFIRMSCollector
from .noaa_weather_collector import NOAAWeatherCollector
from .openmeteo_weather_collector import OpenMeteoWeatherCollector
from .usgs_terrain_collector import USGSTerrainCollector
from data_pipeline.openmeteo_weather_collector import OpenMeteoWeatherCollector

logger = logging.getLogger(__name__)

class RealTimeDataManager:
    """Manages the full lifecycle of real-time data: collection, processing, caching, and streaming."""

    def __init__(self):
        self.redis_client: Optional[redis.Redis] = None
        self.collectors: Dict[str, Any] = {}
        self.processor = FireDataProcessor()
        self.validator = DataValidator()
        self.is_running = False
        self._stream_subscribers: Dict[str, List[Queue]] = defaultdict(list)
        self.performance_metrics = {
            'collections': 0,
            'errors': 0,
            'last_update': None,
            'data_points': 0
        }

    async def initialize(self):
        """Initializes the Redis connection and all data collectors."""
        logger.info("Initializing Real-Time Data Manager...")
        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                decode_responses=True,
                socket_connect_timeout=5
            )
            await self.redis_client.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.warning(f"Redis not available due to error: {e}. Caching and history features will be disabled.")
            self.redis_client = None

        # Initialize data collectors
        self.collectors['nasa_firms'] = NASAFIRMSCollector(settings.nasa_firms_api_key)
        self.collectors['noaa_weather'] = NOAAWeatherCollector(settings.noaa_api_key)
        # ✅ FIXED: Pass the required api_key argument to the USGSTerrainCollector
        self.collectors['usgs_terrain'] = USGSTerrainCollector(settings.usgs_api_key or "demo_key")


        for name, collector in self.collectors.items():
            await collector.initialize()
            logger.info(f"Initialized {name} collector.")

        self.is_running = True
        logger.info("Real-Time Data Manager initialized successfully.")

    def is_healthy(self) -> bool:
        """Checks if the data pipeline and its core components are healthy."""
        collectors_ok = all(c.is_healthy() for c in self.collectors.values())
        return self.is_running and collectors_ok

    async def collect_all_data(self) -> Dict[str, Any]:
        """Coordinates a full data collection cycle from all sources in parallel."""
        start_time = datetime.utcnow()
        bounds = settings.collection_bounds

        tasks = {
            "fire": self._collect_fire_data(bounds),
            "weather": self._collect_weather_data(bounds),
            "terrain": self._collect_terrain_data(bounds),
        }
        results = await asyncio.gather(*tasks.values(), return_exceptions=True)

        collected_data = {}
        for name, result in zip(tasks.keys(), results):
            if isinstance(result, Exception):
                logger.error(f"Failed to collect data for '{name}': {result}", exc_info=result)
                self.performance_metrics['errors'] += 1
            else:
                collected_data[name] = result

        validation_result = await self.validator.validate_collection(collected_data)
        if not validation_result['valid']:
            logger.warning(f"Data validation failed: {validation_result['errors']}")

        processed_data = await self.processor.process_collection(collected_data)
        await self._cache_data(processed_data)
        await self._broadcast_to_streams(processed_data)

        self.performance_metrics['collections'] += 1
        self.performance_metrics['last_update'] = datetime.utcnow().isoformat()
        self.performance_metrics['data_points'] = self._count_data_points(processed_data)

        duration = (datetime.utcnow() - start_time).total_seconds()
        logger.info(f"Data collection completed in {duration:.2f} seconds.")
        return processed_data

    # backend/data_pipeline/real_time_feeds.py (add this method)

    async def collect_area_data(self, bounds: Dict[str, float]) -> Dict[str, Any]:
        """
        Collect all data types for a specific geographic area

        Args:
            bounds: Dictionary with 'north', 'south', 'east', 'west'

        Returns:
            Comprehensive area data for quantum processing
        """
        start_time = datetime.now()

        try:
            # Run parallel collection for all data types
            tasks = {
                'fire': self._collect_fire_data(bounds),
                'weather': self._collect_weather_data(bounds),
                'terrain': self._collect_terrain_data(bounds)
            }

            results = await asyncio.gather(*tasks.values(), return_exceptions=True)

            area_data = {}
            for name, result in zip(tasks.keys(), results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to collect {name} data for area: {result}")
                    # Provide default data structure
                    if name == 'fire':
                        area_data[name] = {'active_fires': [], 'metadata': {'error': str(result)}}
                    elif name == 'weather':
                        area_data[name] = {
                            'current_conditions': {
                                'avg_temperature': 20,
                                'avg_humidity': 50,
                                'avg_wind_speed': 10,
                                'max_wind_speed': 15,
                                'dominant_wind_direction': 0
                            },
                            'metadata': {'error': str(result)}
                        }
                    elif name == 'terrain':
                        area_data[name] = {'elevation_grid': np.zeros((50, 50)), 'metadata': {'error': str(result)}}
                else:
                    area_data[name] = result

            # Process the collected data
            processed_data = await self.processor.process_collection(area_data)

            # Add collection metadata
            processed_data['collection_metadata'] = {
                'bounds': bounds,
                'collection_time': (datetime.now() - start_time).total_seconds(),
                'timestamp': datetime.now().isoformat()
            }

            return processed_data

        except Exception as e:
            logger.error(f"Critical error in area data collection: {str(e)}")
            raise

    async def queue_critical_alert(self, alert_data: Dict[str, Any]):
        """Queue a critical alert for immediate notification"""
        try:
            alert = {
                'id': f"alert_{datetime.now().timestamp()}",
                'timestamp': datetime.now().isoformat(),
                **alert_data
            }

            # Store in Redis
            if self.redis_client:
                await self.redis_client.lpush('alerts:critical', json.dumps(alert))
                await self.redis_client.ltrim('alerts:critical', 0, 99)  # Keep last 100

                # Publish to subscribers
                await self.redis_client.publish('alerts:channel', json.dumps(alert))

            # Add to stream subscribers
            await self._broadcast_to_streams({'type': 'alert', 'data': alert}, 'alerts')

            logger.warning(f"Critical alert queued: {alert_data.get('message', 'Unknown')}")

        except Exception as e:
            logger.error(f"Failed to queue critical alert: {str(e)}")

    async def _queue_priority_prediction(self, high_risk_area: Dict[str, Any]):
        """Queue a priority prediction for high-risk area"""
        try:
            priority_request = {
                'location': {
                    'latitude': high_risk_area['latitude'],
                    'longitude': high_risk_area['longitude']
                },
                'radius': 25,  # km
                'priority': 'high',
                'reason': f"Risk level: {high_risk_area['risk_level']}",
                'queued_at': datetime.now().isoformat()
            }

            if self.redis_client:
                await self.redis_client.lpush(
                    'predictions:priority_queue',
                    json.dumps(priority_request)
                )

            logger.info(
                f"Queued priority prediction for high-risk area at {high_risk_area['latitude']:.4f}, {high_risk_area['longitude']:.4f}")

        except Exception as e:
            logger.error(f"Failed to queue priority prediction: {str(e)}")

    async def _collect_fire_data(self, bounds: Dict) -> Dict:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=1)
        fire_data = await self.collectors['nasa_firms'].get_active_fires(
            bounds, start_date, end_date, settings.minimum_fire_confidence
        )
        if settings.enable_historical_validation:
            fire_data['historical'] = await self.collectors['nasa_firms'].get_historical_fires(
                bounds, settings.nasa_firms_days_back
            )
        return fire_data

    async def _collect_weather_data(self, bounds: Dict) -> Dict:
        """Collect weather data with proper error handling"""
        try:
            # Use Open-Meteo collector instead of NOAA
            if 'openmeteo' not in self.collectors:
                self.collectors['openmeteo'] = OpenMeteoWeatherCollector()
                await self.collectors['openmeteo'].initialize()

            weather_data = await self.collectors['openmeteo'].get_weather_data(
                bounds,
                forecast_days=settings.weather_forecast_days
            )

            # Log high-risk areas for immediate quantum analysis
            if weather_data.get('high_risk_areas'):
                logger.warning(f"Found {len(weather_data['high_risk_areas'])} high-risk weather areas")

                # Trigger immediate quantum prediction for high-risk areas
                for area in weather_data['high_risk_areas']:
                    if area['risk_level'] in ['extreme', 'very_high']:
                        await self._queue_priority_prediction(area)

            return weather_data

        except Exception as e:
            logger.error(f"Weather collection failed: {str(e)}")

            # Return minimal valid data structure to prevent NoData errors
            return {
                'stations': [],
                'current_conditions': {
                    'avg_temperature': 20,
                    'avg_humidity': 50,
                    'avg_wind_speed': 10,
                    'max_wind_speed': 15,
                    'dominant_wind_direction': 0
                },
                'fire_weather': {
                    'max_fosberg': 30,
                    'avg_fosberg': 20,
                    'red_flag_warning_count': 0
                },
                'metadata': {
                    'source': 'Open-Meteo',
                    'collection_time': datetime.now().isoformat(),
                    'error': str(e)
                }
            }

    async def _collect_terrain_data(self, bounds: Dict) -> Dict:
        cache_key = f"terrain:{bounds['north']}:{bounds['south']}:{bounds['east']}:{bounds['west']}"
        if self.redis_client and (cached := await self.redis_client.get(cache_key)):
            return json.loads(cached)

        terrain_data = await self.collectors['usgs_terrain'].get_terrain_data(bounds, resolution=30)
        terrain_data['fuel'] = await self.collectors['usgs_terrain'].get_fuel_data(bounds)

        if self.redis_client:
            await self.redis_client.setex(cache_key, timedelta(days=7), json.dumps(terrain_data))
        return terrain_data

    async def get_latest_fire_data(self) -> Optional[Dict[str, Any]]:
        if self.redis_client and (data := await self.redis_client.get("latest:fire")):
            return json.loads(data)
        return None

    async def get_latest_weather_data(self) -> Optional[Dict[str, Any]]:
        if self.redis_client and (data := await self.redis_client.get("latest:weather")):
            return json.loads(data)
        return None

    async def store_prediction(self, prediction: Dict[str, Any]):
        if not self.redis_client: return
        pred_id = prediction.get('prediction_id')
        if not pred_id: return

        await self.redis_client.setex(f"prediction:{pred_id}", timedelta(hours=1), json.dumps(prediction))
        await self.redis_client.lpush("prediction:history", pred_id)
        await self.redis_client.ltrim("prediction:history", 0, 99)
        await self._broadcast_to_streams({'type': 'prediction', 'data': prediction}, 'predictions')

    async def subscribe_to_stream(self, stream_type: str) -> Queue:
        queue = Queue()
        self._stream_subscribers[stream_type].append(queue)
        return queue

    async def get_data_for_location(self, latitude: float, longitude: float, radius_km: float = 50) -> Dict[str, Any]:
        point = Point(longitude, latitude)
        fire_data = await self.get_latest_fire_data() or {}
        weather_data = await self.get_latest_weather_data() or {}

        nearby_fires = []
        if 'active_fires' in fire_data:
            for fire in fire_data['active_fires']:
                dist = point.distance(Point(fire['longitude'], fire['latitude'])) * 111.32
                if dist <= radius_km:
                    nearby_fires.append({**fire, 'distance_km': round(dist, 2)})

        return {
            'location': {'latitude': latitude, 'longitude': longitude, 'radius_km': radius_km},
            'nearby_fires': nearby_fires,
            'weather': self._interpolate_weather(weather_data, latitude, longitude),
            'terrain': self._extract_terrain_at_point(await self._collect_terrain_data(settings.collection_bounds), latitude, longitude),
            'timestamp': datetime.utcnow().isoformat()
        }

    async def get_paradise_demo_data(self) -> Dict[str, Any]:
        return {
            'location': {'name': 'Paradise, California', 'latitude': settings.paradise_lat, 'longitude': settings.paradise_lon},
            'date': '2018-11-08T06:30:00Z',
            'conditions': {'wind_speed_mph': 50, 'wind_direction_deg': 45, 'humidity_pct': 23, 'temp_c': 15, 'fuel_moisture_pct': 8},
            'fire_origin': {'latitude': 39.794, 'longitude': -121.605, 'name': 'Camp Fire Origin'},
            'ember_cast_potential': 'extreme',
            'actual_outcome': {'fatalities': 85, 'structures_destroyed': 18804}
        }

    async def _cache_data(self, data: Dict[str, Any]):
        if not self.redis_client: return
        if 'fire' in data:
            await self.redis_client.setex("latest:fire", settings.cache_ttl, json.dumps(data['fire']))
        if 'weather' in data:
            await self.redis_client.setex("latest:weather", settings.cache_ttl, json.dumps(data['weather']))

    async def _broadcast_to_streams(self, data: Dict[str, Any], stream_type: str = 'all'):
        streams_to_notify = self._stream_subscribers.keys() if stream_type == 'all' else [stream_type]
        for stream in streams_to_notify:
            for queue in list(self.stream_subscribers.get(stream, [])):
                try:
                    queue.put_nowait(data)
                except asyncio.QueueFull:
                    self.stream_subscribers[stream].remove(queue)

    def _count_data_points(self, data: Dict[str, Any]) -> int:
        count = 0
        if 'fire' in data and 'active_fires' in data['fire']:
            count += len(data['fire']['active_fires'])
        if 'weather' in data and 'stations' in data['weather']:
            count += len(data['weather']['stations'])
        return count

    def _interpolate_weather(self, weather_data: Dict, lat: float, lon: float) -> Dict:
        stations = weather_data.get('stations', [])
        if not stations: return {}
        distances = np.array([np.sqrt((s['latitude'] - lat)**2 + (s['longitude'] - lon)**2) for s in stations])
        return stations[np.argmin(distances)] if stations else {}

    def _extract_terrain_at_point(self, terrain_data: Dict, lat: float, lon: float) -> Dict:
        # This is a placeholder for a more complex GIS operation.
        return {
            'elevation': terrain_data.get('elevation_mean', 0),
            'slope': terrain_data.get('slope_mean', 0),
            'aspect': terrain_data.get('aspect_mean', 0),
            'fuel_model': terrain_data.get('fuel_model_dominant', 'default')
        }

    async def shutdown(self):
        logger.info("Shutting down Real-Time Data Manager...")
        self.is_running = False
        for collector in self.collectors.values():
            await collector.shutdown()
        if self.redis_client:
            await self.redis_client.close()
        logger.info("Real-Time Data Manager shutdown complete.")