"""
Real-time Data Feeds Manager for Quantum Fire Prediction System
Location: backend/data_pipeline/real_time_feeds.py
"""

import asyncio
import os

import aiohttp
import logging
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import json
from asyncio import Queue
import redis.asyncio as redis
from collections import defaultdict
import geopandas as gpd
from shapely.geometry import Point, Polygon

from config import settings
from .nasa_firms_collector import NASAFIRMSCollector
from .noaa_weather_collector import NOAAWeatherCollector
from .usgs_terrain_collector import USGSTerrainCollector
from .data_processor import FireDataProcessor
from .data_validation import DataValidator

logger = logging.getLogger(__name__)

import redis
from redis.exceptions import ConnectionError

class RealTimeDataManager:
    """Manages real-time data collection and streaming for fire prediction"""

    def __init__(self):
        self.collectors = {}
        self.processor = FireDataProcessor()
        self.validator = DataValidator()
        self.redis_client = None
        self.data_streams = defaultdict(Queue)
        self.is_running = False
        self._collection_tasks = []
        self._stream_subscribers = defaultdict(list)
        self.performance_metrics = {
            'collections': 0,
            'errors': 0,
            'last_update': None,
            'data_points': 0
        }
        try:
            self.redis_client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                decode_responses=True,
                socket_connect_timeout=5,
                retry_on_timeout=True
            )
            self.redis_client.ping()  # Test connection
            self.redis_available = True
            logger.info("Successfully connected to Redis")
        except ConnectionError as e:
            logger.warning(f"Redis not available: {e}. Some features will be limited.")
            self.redis_available = False

    async def initialize(self):
        """Initialize all data collectors and connections"""
        logger.info("Initializing Real-Time Data Manager...")

        # Initialize Redis for caching (optional)
        try:
            self.redis_client = redis.from_url(
                settings.redis_url,
                password=settings.redis_password,
                decode_responses=True
            )
            # Test connection synchronously
            self.redis_client.ping()
            self.redis_available = True
            logger.info("Successfully connected to Redis")
        except Exception as e:
            logger.warning(f"Redis not available: {e}. Running without cache.")
            self.redis_client = None
            self.redis_available = False

        # Initialize data collectors
        self.collectors['nasa_firms'] = NASAFIRMSCollector(settings.nasa_firms_api_key or "demo_key")
        self.collectors['noaa_weather'] = NOAAWeatherCollector(settings.noaa_api_key or "demo_key")
        self.collectors['usgs_terrain'] = USGSTerrainCollector(settings.usgs_api_key or "demo_key")

        # Initialize each collector
        for name, collector in self.collectors.items():
            await collector.initialize()
            logger.info(f"Initialized {name} collector")

        self.is_running = True
        logger.info("Real-Time Data Manager initialized successfully")

    def is_healthy(self) -> bool:
        """Check if data pipeline is healthy"""
        return self.is_running and all(
            collector.is_healthy() for collector in self.collectors.values()
        )

    async def collect_all_data(self) -> Dict[str, Any]:
        """Collect data from all sources"""
        try:
            start_time = datetime.now()
            collected_data = {}

            # Define collection area (California for now)
            bounds = {
                'north': 42.0,
                'south': 32.5,
                'east': -114.0,
                'west': -124.5
            }

            # Collect from each source in parallel
            tasks = []

            # NASA FIRMS fire data
            tasks.append(self._collect_fire_data(bounds))

            # NOAA weather data
            tasks.append(self._collect_weather_data(bounds))

            # USGS terrain data (cached, doesn't change often)
            tasks.append(self._collect_terrain_data(bounds))

            # Wait for all collections
            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Collection error: {str(result)}")
                    self.performance_metrics['errors'] += 1
                else:
                    if i == 0:  # Fire data
                        collected_data['fire'] = result
                    elif i == 1:  # Weather data
                        collected_data['weather'] = result
                    elif i == 2:  # Terrain data
                        collected_data['terrain'] = result

            # Validate collected data
            validation_result = await self.validator.validate_collection(collected_data)
            if not validation_result['valid']:
                logger.warning(f"Data validation failed: {validation_result['errors']}")

            # Process and enhance data
            processed_data = await self.processor.process_collection(collected_data)

            # Cache processed data
            await self._cache_data(processed_data)

            # Broadcast to streams
            await self._broadcast_to_streams(processed_data)

            # Update metrics
            self.performance_metrics['collections'] += 1
            self.performance_metrics['last_update'] = datetime.now()
            self.performance_metrics['data_points'] += self._count_data_points(processed_data)

            collection_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"Data collection completed in {collection_time:.2f} seconds")

            return processed_data

        except Exception as e:
            logger.error(f"Error in data collection: {str(e)}")
            self.performance_metrics['errors'] += 1
            raise

    async def _collect_fire_data(self, bounds: Dict[str, float]) -> Dict[str, Any]:
        """Collect fire data from NASA FIRMS"""
        collector = self.collectors['nasa_firms']

        # Get active fires from last 24 hours
        end_date = datetime.now()
        start_date = end_date - timedelta(days=1)

        fire_data = await collector.get_active_fires(
            bounds=bounds,
            start_date=start_date,
            end_date=end_date,
            confidence_threshold=settings.minimum_fire_confidence
        )

        # Enhance with historical data if available
        if settings.enable_historical_validation:
            historical = await collector.get_historical_fires(
                bounds=bounds,
                days_back=settings.nasa_firms_days_back
            )
            fire_data['historical'] = historical

        return fire_data

    async def _collect_weather_data(self, bounds: Dict[str, float]) -> Dict[str, Any]:
        """Collect weather data from NOAA"""
        collector = self.collectors['noaa_weather']

        # Get current conditions and forecast
        weather_data = await collector.get_weather_data(
            bounds=bounds,
            forecast_days=settings.weather_forecast_days
        )

        # Get specialized fire weather data
        fire_weather = await collector.get_fire_weather_data(bounds)
        weather_data['fire_weather'] = fire_weather

        # Get wind field at multiple heights
        wind_field = await collector.get_wind_field(
            bounds=bounds,
            heights=[10, 50, 100, 500]  # meters
        )
        weather_data['wind_field_3d'] = wind_field

        return weather_data

    async def _collect_terrain_data(self, bounds: Dict[str, float]) -> Dict[str, Any]:
        """Collect terrain data from USGS"""
        # Check cache first
        cache_key = f"terrain:{bounds['north']}:{bounds['south']}:{bounds['east']}:{bounds['west']}"
        cached_terrain = await self.redis_client.get(cache_key)

        if cached_terrain:
            return json.loads(cached_terrain)

        # Collect from USGS
        collector = self.collectors['usgs_terrain']
        terrain_data = await collector.get_terrain_data(
            bounds=bounds,
            resolution=30  # 30 meter resolution
        )

        # Get vegetation/fuel data
        fuel_data = await collector.get_fuel_data(bounds)
        terrain_data['fuel'] = fuel_data

        # Cache for 7 days (terrain doesn't change often)
        await self.redis_client.setex(
            cache_key,
            7 * 24 * 3600,
            json.dumps(terrain_data)
        )

        return terrain_data

    async def get_latest_fire_data(self) -> Optional[Dict[str, Any]]:
        """Get latest cached fire data"""
        data = await self.redis_client.get("latest:fire_data")
        return json.loads(data) if data else None

    async def get_latest_weather_data(self) -> Optional[Dict[str, Any]]:
        """Get latest cached weather data"""
        data = await self.redis_client.get("latest:weather_data")
        return json.loads(data) if data else None

    async def store_prediction(self, prediction: Dict[str, Any]):
        """Store fire prediction result"""
        prediction_id = prediction.get('prediction_id')

        # Store in Redis with expiration
        await self.redis_client.setex(
            f"prediction:{prediction_id}",
            3600,  # 1 hour expiration
            json.dumps(prediction)
        )

        # Add to prediction history
        await self.redis_client.lpush(
            "prediction:history",
            prediction_id
        )
        await self.redis_client.ltrim("prediction:history", 0, 99)  # Keep last 100

        # Broadcast to prediction stream
        await self._broadcast_to_streams(
            {'type': 'prediction', 'data': prediction},
            stream_type='predictions'
        )

    async def subscribe_to_stream(self, stream_type: str) -> Queue:
        """Subscribe to a data stream"""
        queue = Queue()
        self._stream_subscribers[stream_type].append(queue)
        return queue

    async def get_data_for_location(
            self,
            latitude: float,
            longitude: float,
            radius_km: float = 50
    ) -> Dict[str, Any]:
        """Get all relevant data for a specific location"""
        try:
            point = Point(longitude, latitude)

            # Get cached data
            fire_data = await self.get_latest_fire_data()
            weather_data = await self.get_latest_weather_data()
            terrain_data = await self.redis_client.get(f"terrain:{latitude}:{longitude}")

            # Filter fire data by radius
            nearby_fires = []
            if fire_data and 'active_fires' in fire_data:
                for fire in fire_data['active_fires']:
                    fire_point = Point(fire['longitude'], fire['latitude'])
                    distance = point.distance(fire_point) * 111  # Approximate km
                    if distance <= radius_km:
                        fire['distance_km'] = distance
                        nearby_fires.append(fire)

            # Get weather for specific location
            location_weather = None
            if weather_data:
                # Interpolate weather data for location
                location_weather = self._interpolate_weather(
                    weather_data, latitude, longitude
                )

            # Get terrain for location
            location_terrain = None
            if terrain_data:
                terrain_dict = json.loads(terrain_data)
                location_terrain = self._extract_terrain_at_point(
                    terrain_dict, latitude, longitude
                )

            return {
                'location': {
                    'latitude': latitude,
                    'longitude': longitude,
                    'radius_km': radius_km
                },
                'nearby_fires': nearby_fires,
                'weather': location_weather,
                'terrain': location_terrain,
                'timestamp': datetime.now().isoformat()
            }

        except Exception as e:
            logger.error(f"Error getting location data: {str(e)}")
            raise

    async def get_paradise_demo_data(self) -> Dict[str, Any]:
        """Get data for Paradise Fire demonstration"""
        # Paradise, CA coordinates
        paradise_lat = settings.paradise_lat
        paradise_lon = settings.paradise_lon

        # Get historical data for November 8, 2018
        demo_data = {
            'location': {
                'name': 'Paradise, California',
                'latitude': paradise_lat,
                'longitude': paradise_lon
            },
            'date': '2018-11-08',
            'time': '06:30:00',  # Fire started
            'conditions': {
                'wind_speed': 50,  # mph
                'wind_direction': 45,  # NE winds
                'humidity': 23,  # Very low
                'temperature': 15,  # Celsius
                'fuel_moisture': 8  # Very dry
            },
            'fire_origin': {
                'latitude': 39.794,
                'longitude': -121.605,
                'name': 'Camp Fire Origin',
                'distance_from_paradise_km': 11.3
            },
            'ember_cast_potential': 'extreme',
            'actual_outcome': {
                'paradise_ignition_time': '08:00:00',
                'evacuation_order_time': '08:05:00',
                'fatalities': 85,
                'structures_destroyed': 18804
            }
        }

        return demo_data

    async def _cache_data(self, data: Dict[str, Any]):
        """Cache processed data in Redis"""
        timestamp = datetime.now().isoformat()

        # Cache fire data
        if 'fire' in data:
            await self.redis_client.setex(
                "latest:fire_data",
                settings.cache_ttl,
                json.dumps(data['fire'])
            )

        # Cache weather data
        if 'weather' in data:
            await self.redis_client.setex(
                "latest:weather_data",
                settings.cache_ttl,
                json.dumps(data['weather'])
            )

        # Cache complete collection
        await self.redis_client.setex(
            f"collection:{timestamp}",
            3600,  # Keep for 1 hour
            json.dumps(data)
        )

    async def _broadcast_to_streams(
            self,
            data: Dict[str, Any],
            stream_type: str = 'all'
    ):
        """Broadcast data to subscribed streams"""
        streams = [stream_type] if stream_type != 'all' else self._stream_subscribers.keys()

        for stream in streams:
            subscribers = self._stream_subscribers.get(stream, [])
            dead_subscribers = []

            for queue in subscribers:
                try:
                    # Non-blocking put
                    queue.put_nowait(data)
                except asyncio.QueueFull:
                    # Remove full queues
                    dead_subscribers.append(queue)

            # Clean up dead subscribers
            for queue in dead_subscribers:
                self._stream_subscribers[stream].remove(queue)

    def _count_data_points(self, data: Dict[str, Any]) -> int:
        """Count total data points collected"""
        count = 0

        if 'fire' in data and 'active_fires' in data['fire']:
            count += len(data['fire']['active_fires'])

        if 'weather' in data and 'stations' in data['weather']:
            count += len(data['weather']['stations'])

        return count

    def _interpolate_weather(
            self,
            weather_data: Dict[str, Any],
            lat: float,
            lon: float
    ) -> Dict[str, Any]:
        """Interpolate weather data for specific location"""
        # Simple nearest neighbor for now
        if 'stations' not in weather_data:
            return {}

        nearest_station = None
        min_distance = float('inf')

        for station in weather_data['stations']:
            distance = np.sqrt(
                (station['latitude'] - lat) ** 2 +
                (station['longitude'] - lon) ** 2
            )
            if distance < min_distance:
                min_distance = distance
                nearest_station = station

        return nearest_station if nearest_station else {}

    def _extract_terrain_at_point(
            self,
            terrain_data: Dict[str, Any],
            lat: float,
            lon: float
    ) -> Dict[str, Any]:
        """Extract terrain data at specific point"""
        # Simple extraction for now
        return {
            'elevation': terrain_data.get('elevation', 0),
            'slope': terrain_data.get('slope', 0),
            'aspect': terrain_data.get('aspect', 0),
            'fuel_model': terrain_data.get('fuel_model', 'default')
        }

    async def shutdown(self):
        """Shutdown data manager"""
        logger.info("Shutting down Real-Time Data Manager...")

        self.is_running = False

        # Cancel collection tasks
        for task in self._collection_tasks:
            task.cancel()

        # Close Redis connection
        if self.redis_client:
            await self.redis_client.close()

        # Shutdown collectors
        for collector in self.collectors.values():
            await collector.shutdown()

        logger.info("Real-Time Data Manager shutdown complete")