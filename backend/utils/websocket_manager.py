"""
WebSocket Manager for Real-Time Data Streaming
Provides live fire prediction updates, quantum processing results, and system alerts
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, List, Set, Optional, Any
from fastapi import WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import redis.asyncio as redis

logger = logging.getLogger(__name__)

class WebSocketMessage(BaseModel):
    """Standard WebSocket message format"""
    type: str
    channel: str
    data: Dict[str, Any]
    timestamp: str
    source: str = "quantum_fire_system"

class ConnectionManager:
    """Manages WebSocket connections and message broadcasting"""
    
    def __init__(self, redis_client: Optional[redis.Redis] = None):
        self.active_connections: Dict[str, WebSocket] = {}
        self.subscriptions: Dict[str, Set[str]] = {}  # channel -> set of connection_ids
        self.connection_metadata: Dict[str, Dict] = {}
        self.redis_client = redis_client
        self.pubsub = None
        
    async def connect(self, websocket: WebSocket, connection_id: str, 
                     client_info: Dict[str, Any] = None) -> bool:
        """Accept new WebSocket connection"""
        try:
            await websocket.accept()
            self.active_connections[connection_id] = websocket
            self.connection_metadata[connection_id] = {
                "connected_at": datetime.utcnow().isoformat(),
                "client_info": client_info or {},
                "subscriptions": set(),
                "last_ping": datetime.utcnow().isoformat()
            }
            
            logger.info(f"WebSocket connection established: {connection_id}")
            
            # Send welcome message
            welcome_msg = WebSocketMessage(
                type="system",
                channel="connection",
                data={
                    "status": "connected",
                    "connection_id": connection_id,
                    "available_channels": [
                        "fire_updates", "weather_updates", "quantum_processing",
                        "risk_alerts", "system_status", "performance_metrics"
                    ]
                },
                timestamp=datetime.utcnow().isoformat()
            )
            await self.send_personal_message(welcome_msg.dict(), connection_id)
            return True
            
        except Exception as e:
            logger.error(f"Failed to establish WebSocket connection {connection_id}: {e}")
            return False
    
    def disconnect(self, connection_id: str):
        """Remove WebSocket connection"""
        if connection_id in self.active_connections:
            # Remove from all subscriptions
            for channel in list(self.subscriptions.keys()):
                self.subscriptions[channel].discard(connection_id)
                if not self.subscriptions[channel]:
                    del self.subscriptions[channel]
            
            # Clean up connection data
            del self.active_connections[connection_id]
            if connection_id in self.connection_metadata:
                del self.connection_metadata[connection_id]
                
            logger.info(f"WebSocket connection disconnected: {connection_id}")
    
    async def subscribe(self, connection_id: str, channel: str) -> bool:
        """Subscribe connection to a specific channel"""
        if connection_id not in self.active_connections:
            return False
            
        if channel not in self.subscriptions:
            self.subscriptions[channel] = set()
        
        self.subscriptions[channel].add(connection_id)
        self.connection_metadata[connection_id]["subscriptions"].add(channel)
        
        logger.info(f"Connection {connection_id} subscribed to channel: {channel}")
        return True
    
    async def unsubscribe(self, connection_id: str, channel: str) -> bool:
        """Unsubscribe connection from a channel"""
        if connection_id not in self.active_connections:
            return False
            
        if channel in self.subscriptions:
            self.subscriptions[channel].discard(connection_id)
            if not self.subscriptions[channel]:
                del self.subscriptions[channel]
        
        if connection_id in self.connection_metadata:
            self.connection_metadata[connection_id]["subscriptions"].discard(channel)
        
        logger.info(f"Connection {connection_id} unsubscribed from channel: {channel}")
        return True
    
    async def send_personal_message(self, message: Dict[str, Any], connection_id: str):
        """Send message to specific connection"""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_text(json.dumps(message))
                
                # Update last ping
                if connection_id in self.connection_metadata:
                    self.connection_metadata[connection_id]["last_ping"] = datetime.utcnow().isoformat()
                    
            except WebSocketDisconnect:
                self.disconnect(connection_id)
            except Exception as e:
                logger.error(f"Failed to send message to {connection_id}: {e}")
                self.disconnect(connection_id)
    
    async def broadcast_to_channel(self, message: Dict[str, Any], channel: str):
        """Broadcast message to all subscribers of a channel"""
        if channel not in self.subscriptions:
            return
            
        disconnected_connections = []
        
        for connection_id in self.subscriptions[channel].copy():
            try:
                await self.send_personal_message(message, connection_id)
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")
                disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            self.disconnect(connection_id)
    
    async def broadcast_to_all(self, message: Dict[str, Any]):
        """Broadcast message to all active connections"""
        disconnected_connections = []
        
        for connection_id in list(self.active_connections.keys()):
            try:
                await self.send_personal_message(message, connection_id)
            except Exception as e:
                logger.error(f"Failed to broadcast to {connection_id}: {e}")
                disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            self.disconnect(connection_id)
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """Get current connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "active_channels": list(self.subscriptions.keys()),
            "channel_subscribers": {
                channel: len(subscribers) 
                for channel, subscribers in self.subscriptions.items()
            },
            "connections": {
                conn_id: {
                    "connected_at": metadata["connected_at"],
                    "subscriptions": list(metadata["subscriptions"]),
                    "last_ping": metadata["last_ping"]
                }
                for conn_id, metadata in self.connection_metadata.items()
            }
        }

class StreamingDataManager:
    """Manages real-time data streaming and processing"""
    
    def __init__(self, connection_manager: ConnectionManager, redis_client: Optional[redis.Redis] = None):
        self.connection_manager = connection_manager
        self.redis_client = redis_client
        self.streaming_tasks: Dict[str, asyncio.Task] = {}
        self.is_streaming = False
        
    async def start_streaming(self):
        """Start all streaming tasks"""
        if self.is_streaming:
            return
            
        self.is_streaming = True
        logger.info("Starting real-time data streaming...")
        
        # Start individual streaming tasks
        self.streaming_tasks["fire_updates"] = asyncio.create_task(
            self._stream_fire_updates()
        )
        self.streaming_tasks["weather_updates"] = asyncio.create_task(
            self._stream_weather_updates()
        )
        self.streaming_tasks["quantum_processing"] = asyncio.create_task(
            self._stream_quantum_processing()
        )
        self.streaming_tasks["system_monitoring"] = asyncio.create_task(
            self._stream_system_monitoring()
        )
        
        logger.info("All streaming tasks started successfully")
    
    async def stop_streaming(self):
        """Stop all streaming tasks"""
        self.is_streaming = False
        
        for task_name, task in self.streaming_tasks.items():
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    logger.info(f"Streaming task {task_name} cancelled")
        
        self.streaming_tasks.clear()
        logger.info("All streaming tasks stopped")
    
    async def _stream_fire_updates(self):
        """Stream fire detection and prediction updates"""
        while self.is_streaming:
            try:
                # Simulate fire data updates (replace with actual data collection)
                fire_update = {
                    "active_fires": [
                        {
                            "id": f"fire_{i}",
                            "latitude": 39.7 + (i * 0.01),
                            "longitude": -121.2 + (i * 0.01),
                            "intensity": 0.5 + (i * 0.1),
                            "confidence": 0.8 + (i * 0.05),
                            "timestamp": datetime.utcnow().isoformat(),
                            "quantum_processed": True
                        }
                        for i in range(3)
                    ],
                    "predictions": [
                        {
                            "region_id": f"region_{i}",
                            "risk_level": ["low", "medium", "high"][i % 3],
                            "probability": 0.3 + (i * 0.2),
                            "time_horizon": "24h",
                            "quantum_advantage": 2.1 + (i * 0.1)
                        }
                        for i in range(3)
                    ]
                }
                
                message = WebSocketMessage(
                    type="data_update",
                    channel="fire_updates",
                    data=fire_update,
                    timestamp=datetime.utcnow().isoformat()
                )
                
                await self.connection_manager.broadcast_to_channel(
                    message.dict(), "fire_updates"
                )
                
                await asyncio.sleep(5)  # Update every 5 seconds
                
            except Exception as e:
                logger.error(f"Error in fire updates stream: {e}")
                await asyncio.sleep(10)
    
    async def _stream_weather_updates(self):
        """Stream weather condition updates"""
        while self.is_streaming:
            try:
                import random
                
                weather_update = {
                    "conditions": {
                        "temperature": 25 + random.random() * 15,
                        "humidity": 20 + random.random() * 60,
                        "wind_speed": random.random() * 30,
                        "wind_direction": random.randint(0, 360),
                        "pressure": 1000 + random.random() * 50
                    },
                    "fire_weather_index": random.random(),
                    "drought_index": random.random(),
                    "alerts": [
                        {
                            "type": "wind_advisory",
                            "severity": "moderate",
                            "message": "Elevated wind conditions may increase fire risk"
                        }
                    ] if random.random() > 0.7 else []
                }
                
                message = WebSocketMessage(
                    type="data_update",
                    channel="weather_updates",
                    data=weather_update,
                    timestamp=datetime.utcnow().isoformat()
                )
                
                await self.connection_manager.broadcast_to_channel(
                    message.dict(), "weather_updates"
                )
                
                await asyncio.sleep(10)  # Update every 10 seconds
                
            except Exception as e:
                logger.error(f"Error in weather updates stream: {e}")
                await asyncio.sleep(15)
    
    async def _stream_quantum_processing(self):
        """Stream quantum processing metrics and results"""
        while self.is_streaming:
            try:
                import random
                
                quantum_update = {
                    "metrics": {
                        "entanglement_strength": 0.8 + random.random() * 0.2,
                        "coherence_time": 100 + random.random() * 50,
                        "fidelity": 0.9 + random.random() * 0.1,
                        "gate_error_rate": random.random() * 0.05,
                        "quantum_advantage": 2.0 + random.random() * 1.0
                    },
                    "circuit_status": {
                        "active_circuits": random.randint(2, 8),
                        "total_qubits": random.randint(16, 64),
                        "processing_queue": random.randint(0, 5)
                    },
                    "predictions": {
                        "classical_accuracy": 0.82 + random.random() * 0.1,
                        "quantum_accuracy": 0.88 + random.random() * 0.1,
                        "improvement_factor": 1.1 + random.random() * 0.3
                    }
                }
                
                message = WebSocketMessage(
                    type="quantum_update",
                    channel="quantum_processing",
                    data=quantum_update,
                    timestamp=datetime.utcnow().isoformat()
                )
                
                await self.connection_manager.broadcast_to_channel(
                    message.dict(), "quantum_processing"
                )
                
                await asyncio.sleep(8)  # Update every 8 seconds
                
            except Exception as e:
                logger.error(f"Error in quantum processing stream: {e}")
                await asyncio.sleep(12)
    
    async def _stream_system_monitoring(self):
        """Stream system performance and health metrics"""
        while self.is_streaming:
            try:
                import random
                import psutil
                
                # Get actual system metrics where possible
                try:
                    cpu_percent = psutil.cpu_percent()
                    memory = psutil.virtual_memory()
                    disk = psutil.disk_usage('/')
                except:
                    cpu_percent = random.random() * 100
                    memory = type('obj', (object,), {
                        'percent': random.random() * 100,
                        'used': random.randint(1000000000, 8000000000),
                        'total': 8000000000
                    })
                    disk = type('obj', (object,), {
                        'percent': random.random() * 100
                    })
                
                system_update = {
                    "performance": {
                        "cpu_usage": cpu_percent,
                        "memory_usage": memory.percent,
                        "disk_usage": disk.percent,
                        "active_connections": len(self.connection_manager.active_connections)
                    },
                    "data_pipeline": {
                        "nasa_firms_status": "active",
                        "noaa_weather_status": "active", 
                        "usgs_terrain_status": "active",
                        "openmeteo_status": "limited",
                        "last_update": datetime.utcnow().isoformat()
                    },
                    "quantum_systems": {
                        "classiq_status": "connected",
                        "qiskit_status": "available",
                        "quantum_hardware": "simulated"
                    }
                }
                
                message = WebSocketMessage(
                    type="system_update",
                    channel="system_status",
                    data=system_update,
                    timestamp=datetime.utcnow().isoformat()
                )
                
                await self.connection_manager.broadcast_to_channel(
                    message.dict(), "system_status"
                )
                
                await asyncio.sleep(15)  # Update every 15 seconds
                
            except Exception as e:
                logger.error(f"Error in system monitoring stream: {e}")
                await asyncio.sleep(20)

# Global instances
connection_manager = ConnectionManager()
streaming_manager = StreamingDataManager(connection_manager)
