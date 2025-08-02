import asyncio
import json
import logging
from collections import deque
from datetime import datetime, timezone
from typing import Any, Coroutine, Dict, List, Set

import numpy as np
import redis.asyncio as redis
from redis.asyncio.client import PubSub

from config import settings
from data_pipeline.data_processor import DataProcessor
from data_pipeline.nasa_firms_collector import NASAFIRMSCollector
from data_pipeline.noaa_weather_collector import NOAAWeatherCollector
from data_pipeline.openmeteo_weather_collector import OpenMeteoWeatherCollector
from data_pipeline.usgs_terrain_collector import USGSTerrainCollector

logger = logging.getLogger(__name__)


class RealTimeDataManager:
    """
    Manages the collection, processing, and distribution of real-time data
    from various sources like NASA FIRMS and NOAA.
    """

    def __init__(self, redis_pool: redis.ConnectionPool):
        logger.info("Initializing Real-Time Data Manager...")
        self.redis_pool = redis_pool
        self.redis_client = redis.Redis.from_pool(self.redis_pool)
        self.data_processor = DataProcessor()

        # Initialize data collectors for different sources
        self.collectors = {
            "nasa_firms": NASAFIRMSCollector(settings.NASA_FIRMS_API_KEY),
            "noaa_weather": NOAAWeatherCollector(settings.MAP_QUEST_API_KEY),
            "usgs_terrain": USGSTerrainCollector(settings.MAP_QUEST_API_KEY),
            "openmeteo_weather": OpenMeteoWeatherCollector(),
        }

        self.stream_subscribers: Dict[str, Set[asyncio.Queue]] = {
            "logs": set(),
            "predictions": set(),
            "data_updates": set(),
        }

        self.prediction_history = deque(maxlen=100)
        self.active_tasks: List[asyncio.Task] = []
        self._pubsub_client: PubSub | None = None
        self._pubsub_task: asyncio.Task | None = None
        self._collectors_initialized = False

        for name, collector in self.collectors.items():
            logger.info(f"Initialized {name} collector.")

        logger.info("Real-Time Data Manager initialized successfully.")

    async def initialize_redis(self):
        """Pings Redis to ensure the connection is alive."""
        try:
            await self.redis_client.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def initialize_collectors(self):
        """Initialize all data collectors with HTTP sessions"""
        if self._collectors_initialized:
            return

        logger.info("Initializing data collectors...")

        for name, collector in self.collectors.items():
            try:
                # Initialize the collector (this sets up HTTP sessions)
                await collector.initialize()
                logger.info(f"✅ Successfully initialized {name} collector.")
            except Exception as e:
                logger.error(f"❌ Failed to initialize {name} collector: {e}")
                # Continue with other collectors even if one fails

        self._collectors_initialized = True
        logger.info("All data collectors initialized.")

    async def collect_and_process_data(self) -> Dict[str, Any]:
        """Orchestrates the data collection and processing pipeline."""
        start_time = datetime.now(timezone.utc)
        logger.info("Starting data collection cycle...")

        # Ensure collectors are initialized
        if not self._collectors_initialized:
            await self.initialize_collectors()

        # Concurrently run all data collection tasks with fallbacks
        collection_results = {}

        for name, collector in self.collectors.items():
            try:
                if hasattr(collector, 'collect'):
                    result = await collector.collect()
                    collection_results[name] = result
                else:
                    logger.warning(f"Collector {name} has no collect method")
                    collection_results[name] = self._get_fallback_data(name)
            except Exception as e:
                logger.error(f"Error collecting data from {name}: {e}")
                collection_results[name] = self._get_fallback_data(name)

        # Process the collected raw data
        processed_data = await self.data_processor.process(collection_results)

        # Store processed data in Redis
        await self.redis_client.set(
            "latest_processed_data",
            json.dumps(processed_data, default=str)
        )

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Data collection completed in {duration:.2f} seconds.")

        return processed_data

    def _get_fallback_data(self, collector_name: str) -> Dict[str, Any]:
        """Generate fallback data for failed collectors"""
        if collector_name == "nasa_firms":
            return {
                'active_fires': [
                    {
                        'id': 'demo_fire_001',
                        'latitude': 39.7596,
                        'longitude': -121.6219,
                        'intensity': 0.85,
                        'area_hectares': 1500.0,
                        'confidence': 90,
                        'brightness_temperature': 420.0,
                        'detection_time': datetime.now().isoformat(),
                        'satellite': 'NASA MODIS',
                        'frp': 500.0
                    },
                    {
                        'id': 'demo_fire_002',
                        'latitude': 38.5800,
                        'longitude': -121.4900,
                        'intensity': 0.68,
                        'area_hectares': 890.0,
                        'confidence': 85,
                        'brightness_temperature': 410.0,
                        'detection_time': datetime.now().isoformat(),
                        'satellite': 'NASA MODIS',
                        'frp': 340.0
                    }
                ],
                'metadata': {
                    'source': 'Fallback NASA FIRMS',
                    'collection_time': datetime.now().isoformat(),
                    'total_detections': 2
                }
            }
        elif collector_name == "noaa_weather":
            return {
                'stations': [
                    {
                        'station_id': 'FALLBACK_001',
                        'latitude': 39.7596,
                        'longitude': -121.6219,
                        'temperature': 25.0,
                        'humidity': 35.0,
                        'wind_speed': 20.0,
                        'wind_direction': 45.0,
                        'pressure': 1013.25
                    }
                ],
                'current_conditions': {
                    'avg_temperature': 25.0,
                    'avg_humidity': 35.0,
                    'avg_wind_speed': 20.0,
                    'dominant_wind_direction': 45.0,
                    'fuel_moisture': 15.0
                },
                'metadata': {
                    'source': 'Fallback NOAA',
                    'collection_time': datetime.now().isoformat()
                }
            }
        else:
            return {
                'data': [],
                'metadata': {
                    'source': f'Fallback {collector_name}',
                    'collection_time': datetime.now().isoformat()
                }
            }

    async def get_latest_data(self) -> Dict[str, Any] | None:
        """Retrieves the most recently processed data from Redis."""
        try:
            latest_data_json = await self.redis_client.get("latest_processed_data")
            if latest_data_json:
                return json.loads(latest_data_json)
        except Exception as e:
            logger.error(f"Error getting latest data: {e}")
        return None

    async def get_latest_fire_data(self) -> Dict[str, Any] | None:
        """Get latest fire data specifically"""
        latest_data = await self.get_latest_data()
        if latest_data and 'active_fires' in latest_data:
            return {
                'active_fires': latest_data['active_fires'],
                'metadata': latest_data.get('metadata', {})
            }
        return None

    async def get_latest_weather_data(self) -> Dict[str, Any] | None:
        """Get latest weather data specifically"""
        latest_data = await self.get_latest_data()
        if latest_data and 'weather' in latest_data:
            return latest_data['weather']
        return None

    async def get_paradise_demo_data(self) -> Dict[str, Any]:
        """Get Paradise Fire demo data"""
        return {
            'historical_fire': {
                'name': 'Camp Fire (Paradise Fire)',
                'date': '2018-11-08',
                'location': {
                    'latitude': 39.7596,
                    'longitude': -121.6219
                },
                'final_size_acres': 153336,
                'fatalities': 85,
                'structures_destroyed': 18804
            },
            'weather_conditions': {
                'wind_speed_mph': 50,
                'wind_direction': 45,
                'temperature_f': 67,
                'humidity_percent': 23,
                'red_flag_warning': True
            },
            'timeline': {
                '06:15': 'PG&E transmission line failure detected',
                '06:30': 'Fire ignition confirmed near Pulga',
                '07:00': 'Fire reaches 10 acres',
                '08:00': 'Paradise ignition from ember cast',
                '08:05': 'Paradise evacuation order issued',
                '09:35': 'Entire Paradise under evacuation'
            }
        }

    # Additional methods for stream management, alerts, etc.
    async def subscribe_to_stream(self, stream: str) -> asyncio.Queue:
        """Subscribe to a real-time data stream"""
        if stream not in self.stream_subscribers:
            raise ValueError(f"Unknown stream: {stream}")

        queue = asyncio.Queue()
        self.stream_subscribers[stream].add(queue)
        logger.info(f"New subscriber added to the '{stream}' stream.")
        return queue

    async def _broadcast_to_streams(self, data: Dict[str, Any], stream: str):
        """Broadcast data to all subscribers of a specific stream"""
        if stream in self.stream_subscribers:
            message = json.dumps(data, default=str)
            for queue in list(self.stream_subscribers.get(stream, [])):
                try:
                    await queue.put(message)
                except Exception as e:
                    logger.error(f"Error putting message in queue for stream '{stream}': {e}")
