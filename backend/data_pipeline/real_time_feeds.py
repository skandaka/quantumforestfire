import asyncio
import json
import logging
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import Any, Coroutine, Dict, List, Set, Optional

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
    Enhanced Real-Time Data Manager for Phase 2
    Manages collection, processing, and distribution of real-time data
    with improved caching, error handling, and performance monitoring.
    """

    def __init__(self, redis_pool: redis.ConnectionPool):
        logger.info("Initializing Enhanced Real-Time Data Manager (Phase 2)...")
        self.redis_pool = redis_pool
        self.redis_client = redis.Redis.from_pool(self.redis_pool)
        self.data_processor = DataProcessor()

        # Enhanced data collectors with better error handling
        self.collectors = {
            "nasa_firms": NASAFIRMSCollector(settings.NASA_FIRMS_API_KEY),
            "noaa_weather": NOAAWeatherCollector(settings.MAP_QUEST_API_KEY),
            "usgs_terrain": USGSTerrainCollector(settings.MAP_QUEST_API_KEY),
            "openmeteo_weather": OpenMeteoWeatherCollector(),
        }

        # Enhanced stream management
        self.stream_subscribers: Dict[str, Set[asyncio.Queue]] = {
            "logs": set(),
            "predictions": set(),
            "data_updates": set(),
            "fire_alerts": set(),
            "weather_updates": set(),
        }

        # Enhanced data caching
        self.prediction_history = deque(maxlen=1000)  # Increased capacity
        self.fire_data_cache = deque(maxlen=500)
        self.weather_data_cache = deque(maxlen=200)
        self.active_tasks: List[asyncio.Task] = []
        self._pubsub_client: PubSub | None = None
        
        # Performance tracking
        self.last_update_times = {
            "nasa_firms": None,
            "noaa_weather": None,
            "openmeteo_weather": None,
            "usgs_terrain": None,
        }
        self.update_intervals = {
            "nasa_firms": 300,  # 5 minutes
            "noaa_weather": 600,     # 10 minutes
            "openmeteo_weather": 600,     # 10 minutes
            "usgs_terrain": 3600,    # 1 hour
        }
        self.error_counts = {source: 0 for source in self.collectors.keys()}
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
        """Enhanced data collection with performance monitoring and caching."""
        start_time = datetime.now(timezone.utc)
        logger.info("🔄 Starting enhanced data collection cycle...")

        # Ensure collectors are initialized
        if not self._collectors_initialized:
            await self.initialize_collectors()

        # Determine which collectors need updates based on intervals
        collectors_to_update = self._get_collectors_needing_update()
        
        # Concurrently run data collection with improved error handling
        collection_results = {}
        collection_tasks = []

        for name in collectors_to_update:
            collector = self.collectors[name]
            task = asyncio.create_task(self._collect_with_retry(name, collector))
            collection_tasks.append((name, task))

        # Wait for all collections with timeout
        for name, task in collection_tasks:
            try:
                result = await asyncio.wait_for(task, timeout=30.0)
                collection_results[name] = result
                self.last_update_times[name] = start_time
                self.error_counts[name] = 0  # Reset error count on success
                logger.info(f"✅ Successfully collected data from {name}")
            except asyncio.TimeoutError:
                logger.error(f"⏰ Timeout collecting data from {name}")
                collection_results[name] = await self._get_cached_or_fallback_data(name)
                self.error_counts[name] += 1
            except Exception as e:
                logger.error(f"❌ Error collecting data from {name}: {e}")
                collection_results[name] = await self._get_cached_or_fallback_data(name)
                self.error_counts[name] += 1

        # Add cached data for collectors that don't need updates
        for name in self.collectors.keys():
            if name not in collection_results:
                collection_results[name] = await self._get_cached_or_fallback_data(name)

        # Enhanced data processing with validation
        try:
            processed_data = await self.data_processor.process_enhanced(collection_results)
            
            # Cache the processed data with timestamp
            cache_entry = {
                'data': processed_data,
                'timestamp': start_time.isoformat(),
                'collection_stats': {
                    'collectors_updated': len(collectors_to_update),
                    'error_counts': self.error_counts.copy(),
                    'duration': (datetime.now(timezone.utc) - start_time).total_seconds()
                }
            }
            
            await self.redis_client.setex(
                "latest_processed_data",
                3600,  # Cache for 1 hour
                json.dumps(cache_entry, default=str)
            )
            
            # Store in memory cache
            self.fire_data_cache.append({
                'timestamp': start_time,
                'data': processed_data.get('fire_data', {}),
            })
            
            # Publish updates to subscribers
            await self._publish_data_updates(processed_data)
            
        except Exception as e:
            logger.error(f"❌ Error processing collected data: {e}")
            processed_data = await self._get_fallback_processed_data()

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        logger.info(f"✅ Enhanced data collection completed in {duration:.2f} seconds")

        return processed_data

    def _get_collectors_needing_update(self) -> List[str]:
        """Determine which collectors need updates based on intervals."""
        now = datetime.now(timezone.utc)
        collectors_to_update = []
        
        for name, last_update in self.last_update_times.items():
            if last_update is None:
                collectors_to_update.append(name)
            else:
                interval = self.update_intervals.get(name, 300)
                if (now - last_update).total_seconds() >= interval:
                    collectors_to_update.append(name)
        
        return collectors_to_update

    async def _collect_with_retry(self, name: str, collector: Any, max_retries: int = 3) -> Dict[str, Any]:
        """Collect data with retry logic."""
        for attempt in range(max_retries):
            try:
                if hasattr(collector, 'collect'):
                    result = await collector.collect()
                    return result
                else:
                    logger.warning(f"Collector {name} has no collect method")
                    return await self._get_fallback_data(name)
                    
            except Exception as e:
                if attempt == max_retries - 1:
                    logger.error(f"❌ Final attempt failed for {name}: {e}")
                    raise
                else:
                    logger.warning(f"⚠️  Attempt {attempt + 1} failed for {name}: {e}, retrying...")
                    await asyncio.sleep(2 ** attempt)  # Exponential backoff

    async def _get_cached_or_fallback_data(self, collector_name: str) -> Dict[str, Any]:
        """Get cached data or fallback data for a collector."""
        try:
            # Try to get cached data from Redis
            cached_key = f"cached_{collector_name}_data"
            cached_data = await self.redis_client.get(cached_key)
            if cached_data:
                logger.info(f"📋 Using cached data for {collector_name}")
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"⚠️  Failed to get cached data for {collector_name}: {e}")
        
        # Fall back to generated data
        logger.info(f"🔄 Using fallback data for {collector_name}")
        return await self._get_fallback_data(collector_name)

    async def _publish_data_updates(self, processed_data: Dict[str, Any]) -> None:
        """Publish data updates to all subscribers."""
        try:
            update_message = {
                'type': 'data_update',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'data': processed_data
            }
            
            # Publish to Redis channels
            await self.redis_client.publish('data_updates', json.dumps(update_message, default=str))
            
            # Notify in-memory subscribers
            for queue in self.stream_subscribers.get('data_updates', set()):
                try:
                    queue.put_nowait(update_message)
                except asyncio.QueueFull:
                    logger.warning("⚠️  Subscriber queue full, skipping update")
                    
        except Exception as e:
            logger.error(f"❌ Failed to publish data updates: {e}")

    async def _get_fallback_processed_data(self) -> Dict[str, Any]:
        """Generate fallback processed data when processing fails."""
        return {
            'fire_data': await self._get_fallback_data('nasa_firms'),
            'weather_data': await self._get_fallback_data('noaa_weather'),
            'terrain_data': await self._get_fallback_data('usgs_terrain'),
            'metadata': {
                'source': 'fallback',
                'timestamp': datetime.now(timezone.utc).isoformat(),
                'status': 'degraded'
            }
        }

    async def _get_fallback_data(self, collector_name: str) -> Dict[str, Any]:
        """Generate enhanced fallback data with realistic patterns for failed collectors."""
        now = datetime.now(timezone.utc)
        
        if collector_name == "nasa_firms":
            # Enhanced California fire data with realistic patterns
            base_fires = [
                {'lat': 39.7596, 'lon': -121.6219, 'name': 'Paradise Area', 'base_intensity': 0.8},
                {'lat': 34.0522, 'lon': -118.2437, 'name': 'Los Angeles Basin', 'base_intensity': 0.6},
                {'lat': 37.7749, 'lon': -122.4194, 'name': 'San Francisco Bay', 'base_intensity': 0.4},
                {'lat': 32.7157, 'lon': -117.1611, 'name': 'San Diego County', 'base_intensity': 0.5},
                {'lat': 36.7783, 'lon': -119.4179, 'name': 'Central Valley', 'base_intensity': 0.7},
            ]
            
            active_fires = []
            for i, fire in enumerate(base_fires):
                # Add some randomness but keep it realistic
                intensity_variation = np.random.uniform(-0.2, 0.3)
                current_intensity = max(0.1, min(1.0, fire['base_intensity'] + intensity_variation))
                
                # Simulate fire growth patterns
                area_base = 500 + (current_intensity * 2000)
                area_variation = np.random.uniform(0.8, 1.2)
                
                active_fires.append({
                    'id': f'fallback_fire_{i+1:03d}',
                    'latitude': fire['lat'] + np.random.uniform(-0.05, 0.05),
                    'longitude': fire['lon'] + np.random.uniform(-0.05, 0.05),
                    'intensity': current_intensity,
                    'area_hectares': area_base * area_variation,
                    'confidence': 0.75 + (current_intensity * 0.2),
                    'brightness_temperature': 300 + (current_intensity * 200),
                    'detection_time': (now - timedelta(minutes=np.random.randint(5, 120))).isoformat(),
                    'satellite': 'NASA MODIS',
                    'frp': current_intensity * 1000,
                    'center_lat': fire['lat'],
                    'center_lon': fire['lon'],
                    'region': fire['name'],
                    'growth_rate': np.random.uniform(0.5, 2.0),
                    'wind_direction': np.random.randint(0, 360),
                    'fuel_moisture': np.random.uniform(5, 25),
                })
                
            return {
                'active_fires': active_fires,
                'total_fires': len(active_fires),
                'data_source': 'fallback_enhanced',
                'last_updated': now.isoformat(),
                'coverage_area': 'California Enhanced',
                'data_quality': 'simulated_realistic'
            }
            
        elif collector_name in ["noaa_weather", "openmeteo_weather"]:
            # Enhanced weather data with realistic California patterns
            weather_stations = [
                {'lat': 39.7596, 'lon': -121.6219, 'name': 'Paradise', 'elevation': 600},
                {'lat': 34.0522, 'lon': -118.2437, 'name': 'Los Angeles', 'elevation': 85},
                {'lat': 37.7749, 'lon': -122.4194, 'name': 'San Francisco', 'elevation': 15},
                {'lat': 32.7157, 'lon': -117.1611, 'name': 'San Diego', 'elevation': 20},
                {'lat': 36.7783, 'lon': -119.4179, 'name': 'Fresno', 'elevation': 100},
            ]
            
            weather_data = []
            for station in weather_stations:
                # Realistic California weather patterns
                base_temp = 20 + (station['elevation'] * -0.01)  # Temperature lapse rate
                seasonal_temp = 15 * np.sin((now.month - 7) * np.pi / 6)  # Seasonal variation
                daily_temp = 10 * np.sin((now.hour - 14) * np.pi / 12)  # Daily variation
                
                temperature = base_temp + seasonal_temp + daily_temp + np.random.uniform(-3, 3)
                
                # California humidity patterns (lower inland, higher coastal)
                coastal_factor = 1.0 if station['name'] in ['San Francisco', 'San Diego'] else 0.6
                base_humidity = 40 * coastal_factor + np.random.uniform(-10, 15)
                
                # Wind patterns (stronger in afternoon, varies by location)
                base_wind = 5 + (15 * np.sin((now.hour - 14) * np.pi / 8))
                wind_speed = max(0, base_wind + np.random.uniform(-3, 3))
                
                weather_data.append({
                    'station_id': f'fallback_wx_{station["name"].lower()}',
                    'latitude': station['lat'],
                    'longitude': station['lon'],
                    'station_name': station['name'],
                    'temperature_celsius': round(temperature, 1),
                    'humidity_percent': max(10, min(95, round(base_humidity, 1))),
                    'wind_speed_kph': round(wind_speed, 1),
                    'wind_direction_degrees': np.random.randint(0, 360),
                    'pressure_hpa': 1013 + np.random.uniform(-10, 10),
                    'visibility_km': max(1, 25 - (base_humidity * 0.2)),
                    'precipitation_mm': 0.0 if now.month in [5,6,7,8,9] else np.random.exponential(2),
                    'observation_time': now.isoformat(),
                    'data_quality': 'simulated_realistic',
                    'fire_weather_index': self._calculate_fire_weather_index(temperature, base_humidity, wind_speed),
                })
                
            return {
                'weather_data': weather_data,
                'forecast_data': self._generate_weather_forecast(weather_stations),
                'data_source': 'fallback_enhanced',
                'last_updated': now.isoformat(),
                'region': 'California Enhanced'
            }
            
        elif collector_name == "usgs_terrain":
            # Enhanced terrain data
            return {
                'terrain_data': [
                    {
                        'region_id': 'ca_terrain_001',
                        'latitude': 39.76,
                        'longitude': -121.62,
                        'elevation_m': 600,
                        'slope_degrees': 15.5,
                        'aspect_degrees': 180,
                        'vegetation_type': 'Mixed Forest',
                        'fuel_load_tons_per_hectare': 45.2,
                        'canopy_cover_percent': 75,
                        'soil_moisture_percent': 12.3,
                        'fire_history_years': [2018, 2020],
                        'access_difficulty': 'moderate',
                        'suppression_resources': ['ground_crew', 'air_tanker']
                    }
                ],
                'data_source': 'fallback_enhanced',
                'last_updated': now.isoformat()
            }
            
        else:
            # Generic fallback
            return {
                'data': f'Fallback data for {collector_name}',
                'timestamp': now.isoformat(),
                'status': 'fallback'
            }

    def _calculate_fire_weather_index(self, temp: float, humidity: float, wind_speed: float) -> float:
        """Calculate a realistic fire weather index."""
        # Simplified fire weather index calculation
        temp_factor = max(0, (temp - 10) / 30)  # Normalized temperature factor
        humidity_factor = max(0, (100 - humidity) / 100)  # Inverted humidity factor
        wind_factor = min(1, wind_speed / 50)  # Wind factor
        
        fwi = (temp_factor * 0.4 + humidity_factor * 0.4 + wind_factor * 0.2) * 100
        return round(fwi, 1)

    def _generate_weather_forecast(self, stations: List[Dict]) -> List[Dict]:
        """Generate realistic weather forecast data."""
        forecast_data = []
        now = datetime.now(timezone.utc)
        
        for hours_ahead in [6, 12, 18, 24, 48, 72]:
            forecast_time = now + timedelta(hours=hours_ahead)
            for station in stations:
                # Simple forecast model with slight degradation over time
                uncertainty = hours_ahead * 0.1
                
                forecast_data.append({
                    'station_name': station['name'],
                    'forecast_time': forecast_time.isoformat(),
                    'temperature_celsius': 20 + np.random.uniform(-uncertainty, uncertainty),
                    'humidity_percent': 50 + np.random.uniform(-uncertainty*2, uncertainty*2),
                    'wind_speed_kph': 10 + np.random.uniform(-uncertainty, uncertainty),
                    'confidence': max(0.5, 0.95 - (hours_ahead * 0.01))
                })
                
        return forecast_data

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
