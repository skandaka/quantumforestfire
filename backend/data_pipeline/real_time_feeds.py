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
# FIX: Changed all relative imports to be absolute from the project root.
from data_pipeline.data_processor import DataProcessor
from data_pipeline.nasa_firms_collector import NASAFIRMSCollector
from data_pipeline.noaa_weather_collector import NOAAWeatherCollector
from data_pipeline.openmeteo_weather_collector import OpenMeteoWeatherCollector
from data_pipeline.usgs_terrain_collector import USGSTerrainCollector

# Set up logging
logger = logging.getLogger(__name__)


class RealTimeDataManager:
    """
    Manages the collection, processing, and distribution of real-time data
    from various sources like NASA FIRMS and NOAA.
    """

    def __init__(self, redis_pool: redis.ConnectionPool):
        """
        Initializes the RealTimeDataManager.

        Args:
            redis_pool: An asynchronous Redis connection pool.
        """
        logger.info("Initializing Real-Time Data Manager...")
        self.redis_pool = redis_pool
        self.redis_client = redis.Redis.from_pool(self.redis_pool)
        self.data_processor = DataProcessor()

        # Initialize data collectors for different sources
        self.collectors = {
            "nasa_firms": NASAFIRMSCollector(),
            "noaa_weather": NOAAWeatherCollector(),
            "usgs_terrain": USGSTerrainCollector(),
            "openmeteo_weather": OpenMeteoWeatherCollector(),
        }

        # Initialize the missing attribute here.
        self.stream_subscribers: Dict[str, Set[asyncio.Queue]] = {
            "logs": set(),
            "predictions": set(),
            "data_updates": set(),
        }

        self.prediction_history = deque(maxlen=100)
        self.active_tasks: List[asyncio.Task] = []
        self._pubsub_client: PubSub | None = None
        self._pubsub_task: asyncio.Task | None = None

        for name, collector in self.collectors.items():
            logger.info(f"Initialized {name} collector.")

        logger.info("Real-Time Data Manager initialized successfully.")

    async def initialize_redis(self):
        """
        Pings Redis to ensure the connection is alive.
        """
        try:
            await self.redis_client.ping()
            logger.info("Successfully connected to Redis.")
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise

    async def start_streaming(self):
        """
        Starts the real-time data streaming and processing tasks.
        """
        if self._pubsub_task and not self._pubsub_task.done():
            logger.warning("Streaming is already running.")
            return

        logger.info("Starting real-time data streaming...")
        self._pubsub_client = self.redis_client.pubsub()
        self._pubsub_task = asyncio.create_task(self._pubsub_listener())
        self.active_tasks.append(self._pubsub_task)
        logger.info("Real-time data streaming started.")

    async def stop_streaming(self):
        """
        Stops all active streaming and processing tasks.
        """
        logger.info("Stopping real-time data streaming...")
        if self._pubsub_task and not self._pubsub_task.done():
            self._pubsub_task.cancel()
            try:
                await self._pubsub_task
            except asyncio.CancelledError:
                pass
        if self._pubsub_client:
            await self._pubsub_client.close()
        logger.info("Real-time data streaming stopped.")

        for task in self.active_tasks:
            if not task.done():
                task.cancel()
        try:
            await asyncio.gather(*self.active_tasks, return_exceptions=True)
        except asyncio.CancelledError:
            pass
        self.active_tasks.clear()
        logger.info("All associated tasks stopped.")

    async def _pubsub_listener(self):
        """
        Listens for messages on subscribed Redis channels.
        """
        await self._pubsub_client.subscribe("system_logs", "predictions", "data_updates")
        logger.info("Subscribed to Redis channels.")
        try:
            async for message in self._pubsub_client.listen():
                if message["type"] == "message":
                    channel = message["channel"].decode("utf-8")
                    data = json.loads(message["data"].decode("utf-8"))
                    await self._broadcast_to_streams(data, channel)
        except asyncio.CancelledError:
            logger.info("Pub/sub listener task cancelled.")
        except Exception as e:
            logger.error(f"Error in Redis pub/sub listener: {e}")
        finally:
            logger.info("Pub/sub listener task finished.")

    async def collect_and_process_data(self) -> Dict[str, Any]:
        """
        Orchestrates the data collection and processing pipeline.

        Returns:
            A dictionary containing the processed data.
        """
        start_time = datetime.now(timezone.utc)
        logger.info("Starting data collection cycle...")

        # Concurrently run all data collection tasks
        collection_tasks: Dict[str, Coroutine[Any, Any, Any]] = {
            name: collector.collect() for name, collector in self.collectors.items()
        }
        results = await asyncio.gather(
            *collection_tasks.values(), return_exceptions=True
        )
        raw_data = dict(zip(collection_tasks.keys(), results))

        # Handle any errors during collection
        for name, result in raw_data.items():
            if isinstance(result, Exception):
                logger.error(f"Error collecting data from {name}: {result}")
                raw_data[name] = None  # Ensure data is None if collection failed

        # Process the collected raw data
        processed_data = await self.data_processor.process(raw_data)

        end_time = datetime.now(timezone.utc)
        duration = (end_time - start_time).total_seconds()
        logger.info(f"Data collection completed in {duration:.2f} seconds.")

        return processed_data

    async def get_latest_data(self) -> Dict[str, Any] | None:
        """
        Retrieves the most recently processed data from Redis.

        Returns:
            A dictionary containing the latest data, or None if not available.
        """
        latest_data_json = await self.redis_client.get("latest_processed_data")
        if latest_data_json:
            return json.loads(latest_data_json)
        return None

    async def get_prediction_history(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Retrieves a list of recent predictions.

        Args:
            limit: The maximum number of predictions to return.

        Returns:
            A list of prediction dictionaries.
        """
        return list(self.prediction_history)[:limit]

    async def store_prediction(self, prediction: Dict[str, Any]):
        """
        Stores a new prediction in Redis and history, and broadcasts it.

        Args:
            prediction: The prediction data to store.
        """
        self.prediction_history.appendleft(prediction)
        prediction_json = json.dumps(prediction, default=self._json_serializer)
        await self.redis_client.lpush("prediction_history", prediction_json)
        await self.redis_client.ltrim("prediction_history", 0, 99)
        await self._broadcast_to_streams({'type': 'prediction', 'data': prediction}, 'predictions')

    async def subscribe_to_stream(self, stream: str) -> asyncio.Queue:
        """
        Allows a client to subscribe to a real-time data stream.

        Args:
            stream: The name of the stream to subscribe to (e.g., 'logs', 'predictions').

        Returns:
            An asyncio.Queue object that will receive messages from the stream.
        """
        if stream not in self.stream_subscribers:
            raise ValueError(f"Unknown stream: {stream}")

        queue = asyncio.Queue()
        self.stream_subscribers[stream].add(queue)
        logger.info(f"New subscriber added to the '{stream}' stream.")
        return queue

    async def unsubscribe_from_stream(self, stream: str, queue: asyncio.Queue):
        """
        Unsubscribes a client from a real-time data stream.

        Args:
            stream: The name of the stream.
            queue: The queue object to remove from the subscription list.
        """
        if stream in self.stream_subscribers:
            self.stream_subscribers[stream].discard(queue)
            logger.info(f"Subscriber removed from the '{stream}' stream.")

    async def _broadcast_to_streams(self, data: Dict[str, Any], stream: str):
        """
        Broadcasts data to all subscribers of a specific stream.

        Args:
            data: The data to broadcast.
            stream: The target stream name.
        """
        if stream in self.stream_subscribers:
            message = json.dumps(data, default=self._json_serializer)
            for queue in list(self.stream_subscribers.get(stream, [])):
                try:
                    await queue.put(message)
                except Exception as e:
                    logger.error(f"Error putting message in queue for stream '{stream}': {e}")
                    # Optionally remove unresponsive queues
                    self.unsubscribe_from_stream(stream, queue)

    def _json_serializer(self, obj: Any) -> Any:
        """
        Custom JSON serializer to handle special data types like datetime and numpy arrays.
        """
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        if isinstance(obj, (np.int64, np.int32)):
            return int(obj)
        if isinstance(obj, (np.float64, np.float32)):
            return float(obj)
        raise TypeError(f"Object of type {obj.__class__.__name__} is not JSON serializable")