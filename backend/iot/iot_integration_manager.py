"""
IoT Integration Module for Quantum Forest Fire Prediction
Handles sensor networks, edge computing, and real-time data collection
"""
import asyncio
import logging
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, asdict
from enum import Enum
import numpy as np
import aiohttp
import websockets
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

class SensorType(Enum):
    TEMPERATURE = "temperature"
    HUMIDITY = "humidity"
    WIND_SPEED = "wind_speed"
    WIND_DIRECTION = "wind_direction"
    SMOKE_DETECTOR = "smoke_detector"
    FLAME_DETECTOR = "flame_detector"
    MOISTURE = "moisture"
    CAMERA = "camera"
    THERMAL_CAMERA = "thermal_camera"
    WEATHER_STATION = "weather_station"
    AIR_QUALITY = "air_quality"

class SensorStatus(Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"
    ERROR = "error"
    LOW_BATTERY = "low_battery"

class AlertLevel(Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    EMERGENCY = "emergency"

@dataclass
class SensorReading:
    """Individual sensor reading data"""
    sensor_id: str
    sensor_type: SensorType
    value: float
    unit: str
    timestamp: datetime
    location: Dict[str, float]  # lat, lon, elevation
    metadata: Dict[str, Any]
    quality_score: float  # 0.0 to 1.0

@dataclass
class IoTDevice:
    """IoT device configuration and status"""
    device_id: str
    device_name: str
    device_type: str
    location: Dict[str, float]
    sensors: List[SensorType]
    status: SensorStatus
    last_seen: datetime
    battery_level: Optional[float]
    firmware_version: str
    network_info: Dict[str, Any]
    configuration: Dict[str, Any]

@dataclass
class EdgeNode:
    """Edge computing node information"""
    node_id: str
    location: Dict[str, float]
    processing_capacity: float
    connected_devices: List[str]
    status: SensorStatus
    last_heartbeat: datetime
    local_predictions: List[Dict[str, Any]]

class IoTAlert(BaseModel):
    """IoT-triggered alert"""
    alert_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    device_id: str
    sensor_type: SensorType
    alert_level: AlertLevel
    message: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    location: Dict[str, float]
    sensor_readings: List[Dict[str, Any]]
    confidence: float
    recommended_actions: List[str]

class IoTIntegrationManager:
    """Manages IoT sensor networks and edge computing"""
    
    def __init__(self):
        self.devices: Dict[str, IoTDevice] = {}
        self.edge_nodes: Dict[str, EdgeNode] = {}
        self.active_connections: Dict[str, Any] = {}
        self.sensor_readings: List[SensorReading] = []
        self.alerts: List[IoTAlert] = []
        self.data_processors: Dict[SensorType, Callable] = {}
        self.alert_callbacks: List[Callable] = []
        
        # Edge computing configuration
        self.edge_processing_enabled = True
        self.local_ml_models = {}
        self.data_buffer_size = 10000
        
        # Network configuration
        self.mqtt_broker_url = "mqtt://localhost:1883"
        self.websocket_server_port = 8765
        self.http_api_port = 8766
        
    async def initialize(self):
        """Initialize IoT integration system"""
        try:
            logger.info("Initializing IoT Integration Manager...")
            
            # Register data processors
            await self._register_data_processors()
            
            # Initialize edge nodes
            await self._initialize_edge_nodes()
            
            # Start communication servers
            await self._start_communication_servers()
            
            # Initialize sample devices
            await self._initialize_sample_devices()
            
            # Start monitoring tasks
            await self._start_monitoring_tasks()
            
            logger.info("IoT Integration Manager initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize IoT Integration Manager: {e}")
            raise
    
    async def _register_data_processors(self):
        """Register sensor data processors"""
        self.data_processors = {
            SensorType.TEMPERATURE: self._process_temperature_data,
            SensorType.HUMIDITY: self._process_humidity_data,
            SensorType.WIND_SPEED: self._process_wind_data,
            SensorType.SMOKE_DETECTOR: self._process_smoke_data,
            SensorType.FLAME_DETECTOR: self._process_flame_data,
            SensorType.CAMERA: self._process_camera_data,
            SensorType.THERMAL_CAMERA: self._process_thermal_camera_data,
            SensorType.WEATHER_STATION: self._process_weather_station_data,
            SensorType.AIR_QUALITY: self._process_air_quality_data
        }
        
        logger.info(f"Registered {len(self.data_processors)} data processors")
    
    async def _initialize_edge_nodes(self):
        """Initialize edge computing nodes"""
        # Create sample edge nodes
        edge_locations = [
            {"lat": 37.1, "lon": -122.1, "elevation": 100},
            {"lat": 37.0, "lon": -122.0, "elevation": 150},
            {"lat": 36.9, "lon": -121.9, "elevation": 200}
        ]
        
        for i, location in enumerate(edge_locations):
            node_id = f"edge_node_{i+1:03d}"
            edge_node = EdgeNode(
                node_id=node_id,
                location=location,
                processing_capacity=100.0,
                connected_devices=[],
                status=SensorStatus.ONLINE,
                last_heartbeat=datetime.utcnow(),
                local_predictions=[]
            )
            self.edge_nodes[node_id] = edge_node
        
        logger.info(f"Initialized {len(self.edge_nodes)} edge nodes")
    
    async def _start_communication_servers(self):
        """Start communication servers for IoT devices"""
        # Start WebSocket server for real-time communication
        asyncio.create_task(self._websocket_server())
        
        # Start HTTP API server for device management
        asyncio.create_task(self._http_api_server())
        
        logger.info("Communication servers started")
    
    async def _initialize_sample_devices(self):
        """Initialize sample IoT devices for demonstration"""
        device_configs = [
            {
                "device_name": "Weather Station Alpha",
                "device_type": "weather_station",
                "location": {"lat": 37.1, "lon": -122.1, "elevation": 100},
                "sensors": [SensorType.TEMPERATURE, SensorType.HUMIDITY, SensorType.WIND_SPEED, SensorType.WIND_DIRECTION]
            },
            {
                "device_name": "Smoke Detector Bravo",
                "device_type": "smoke_detector",
                "location": {"lat": 37.0, "lon": -122.0, "elevation": 150},
                "sensors": [SensorType.SMOKE_DETECTOR, SensorType.TEMPERATURE, SensorType.HUMIDITY]
            },
            {
                "device_name": "Thermal Camera Charlie",
                "device_type": "thermal_camera",
                "location": {"lat": 36.9, "lon": -121.9, "elevation": 200},
                "sensors": [SensorType.THERMAL_CAMERA, SensorType.TEMPERATURE]
            },
            {
                "device_name": "Air Quality Monitor Delta",
                "device_type": "air_quality",
                "location": {"lat": 37.05, "lon": -122.05, "elevation": 125},
                "sensors": [SensorType.AIR_QUALITY, SensorType.TEMPERATURE, SensorType.HUMIDITY]
            }
        ]
        
        for i, config in enumerate(device_configs):
            device_id = f"iot_device_{i+1:03d}"
            device = IoTDevice(
                device_id=device_id,
                device_name=config["device_name"],
                device_type=config["device_type"],
                location=config["location"],
                sensors=config["sensors"],
                status=SensorStatus.ONLINE,
                last_seen=datetime.utcnow(),
                battery_level=np.random.uniform(70, 100),
                firmware_version="1.2.3",
                network_info={
                    "signal_strength": np.random.uniform(-70, -30),
                    "connection_type": "4G",
                    "ip_address": f"192.168.1.{100+i}"
                },
                configuration={
                    "sampling_rate": 60,  # seconds
                    "transmission_interval": 300,  # seconds
                    "alert_thresholds": self._get_alert_thresholds(config["sensors"])
                }
            )
            self.devices[device_id] = device
        
        logger.info(f"Initialized {len(self.devices)} sample IoT devices")
    
    async def _start_monitoring_tasks(self):
        """Start background monitoring tasks"""
        # Device health monitoring
        asyncio.create_task(self._device_health_monitor())
        
        # Data collection simulation
        asyncio.create_task(self._simulate_sensor_data())
        
        # Edge processing task
        asyncio.create_task(self._edge_processing_loop())
        
        # Alert processing
        asyncio.create_task(self._alert_processing_loop())
        
        logger.info("Monitoring tasks started")
    
    async def _websocket_server(self):
        """WebSocket server for real-time device communication"""
        async def handle_client(websocket, path):
            try:
                device_id = None
                async for message in websocket:
                    data = json.loads(message)
                    
                    if data.get("type") == "device_registration":
                        device_id = data.get("device_id")
                        self.active_connections[device_id] = websocket
                        await websocket.send(json.dumps({
                            "type": "registration_ack",
                            "status": "success",
                            "timestamp": datetime.utcnow().isoformat()
                        }))
                    
                    elif data.get("type") == "sensor_data":
                        await self._process_incoming_sensor_data(data)
                    
                    elif data.get("type") == "heartbeat":
                        if device_id and device_id in self.devices:
                            self.devices[device_id].last_seen = datetime.utcnow()
                            self.devices[device_id].status = SensorStatus.ONLINE
            
            except websockets.exceptions.ConnectionClosed:
                if device_id and device_id in self.active_connections:
                    del self.active_connections[device_id]
                    if device_id in self.devices:
                        self.devices[device_id].status = SensorStatus.OFFLINE
            
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
        
        try:
            await websockets.serve(handle_client, "localhost", self.websocket_server_port)
            logger.info(f"WebSocket server started on port {self.websocket_server_port}")
        except Exception as e:
            logger.error(f"Failed to start WebSocket server: {e}")
    
    async def _http_api_server(self):
        """HTTP API server for device management"""
        from aiohttp import web
        
        async def get_devices(request):
            return web.json_response({
                "devices": [asdict(device) for device in self.devices.values()],
                "total_count": len(self.devices),
                "timestamp": datetime.utcnow().isoformat()
            })
        
        async def get_device(request):
            device_id = request.match_info['device_id']
            if device_id in self.devices:
                return web.json_response(asdict(self.devices[device_id]))
            else:
                return web.json_response({"error": "Device not found"}, status=404)
        
        async def get_sensor_data(request):
            device_id = request.match_info.get('device_id')
            limit = int(request.query.get('limit', 100))
            
            readings = self.sensor_readings
            if device_id:
                readings = [r for r in readings if r.sensor_id.startswith(device_id)]
            
            return web.json_response({
                "readings": [asdict(reading) for reading in readings[-limit:]],
                "count": len(readings),
                "timestamp": datetime.utcnow().isoformat()
            })
        
        async def get_alerts(request):
            limit = int(request.query.get('limit', 50))
            return web.json_response({
                "alerts": [alert.dict() for alert in self.alerts[-limit:]],
                "count": len(self.alerts),
                "timestamp": datetime.utcnow().isoformat()
            })
        
        app = web.Application()
        app.router.add_get('/devices', get_devices)
        app.router.add_get('/devices/{device_id}', get_device)
        app.router.add_get('/sensor-data', get_sensor_data)
        app.router.add_get('/sensor-data/{device_id}', get_sensor_data)
        app.router.add_get('/alerts', get_alerts)
        
        try:
            runner = web.AppRunner(app)
            await runner.setup()
            site = web.TCPSite(runner, 'localhost', self.http_api_port)
            await site.start()
            logger.info(f"HTTP API server started on port {self.http_api_port}")
        except Exception as e:
            logger.error(f"Failed to start HTTP API server: {e}")
    
    async def _device_health_monitor(self):
        """Monitor device health and connectivity"""
        while True:
            try:
                current_time = datetime.utcnow()
                
                for device_id, device in self.devices.items():
                    # Check if device is offline
                    time_since_last_seen = current_time - device.last_seen
                    
                    if time_since_last_seen > timedelta(minutes=10):
                        if device.status != SensorStatus.OFFLINE:
                            device.status = SensorStatus.OFFLINE
                            await self._create_alert(
                                device_id=device_id,
                                sensor_type=SensorType.TEMPERATURE,  # Generic
                                alert_level=AlertLevel.WARNING,
                                message=f"Device {device.device_name} has gone offline",
                                location=device.location,
                                confidence=0.9
                            )
                    
                    # Check battery level
                    if device.battery_level and device.battery_level < 20:
                        if device.status != SensorStatus.LOW_BATTERY:
                            device.status = SensorStatus.LOW_BATTERY
                            await self._create_alert(
                                device_id=device_id,
                                sensor_type=SensorType.TEMPERATURE,  # Generic
                                alert_level=AlertLevel.WARNING,
                                message=f"Low battery on device {device.device_name}",
                                location=device.location,
                                confidence=1.0
                            )
                
                await asyncio.sleep(60)  # Check every minute
                
            except Exception as e:
                logger.error(f"Error in device health monitor: {e}")
                await asyncio.sleep(60)
    
    async def _simulate_sensor_data(self):
        """Simulate sensor data for demonstration"""
        while True:
            try:
                current_time = datetime.utcnow()
                
                for device_id, device in self.devices.items():
                    if device.status == SensorStatus.ONLINE:
                        for sensor_type in device.sensors:
                            # Generate realistic sensor data
                            reading = self._generate_sensor_reading(device_id, sensor_type, device.location)
                            self.sensor_readings.append(reading)
                            
                            # Process the reading
                            await self._process_sensor_reading(reading)
                        
                        # Update device last seen
                        device.last_seen = current_time
                        
                        # Simulate battery drain
                        if device.battery_level:
                            device.battery_level -= np.random.uniform(0.01, 0.05)
                
                # Limit sensor readings buffer
                if len(self.sensor_readings) > self.data_buffer_size:
                    self.sensor_readings = self.sensor_readings[-self.data_buffer_size:]
                
                await asyncio.sleep(30)  # Generate data every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in sensor data simulation: {e}")
                await asyncio.sleep(30)
    
    async def _edge_processing_loop(self):
        """Edge computing processing loop"""
        while True:
            try:
                if self.edge_processing_enabled:
                    for node_id, node in self.edge_nodes.items():
                        if node.status == SensorStatus.ONLINE:
                            # Get recent sensor data for this node's area
                            recent_data = self._get_local_sensor_data(node.location)
                            
                            # Run local ML processing
                            if recent_data:
                                local_prediction = await self._run_edge_ml_processing(recent_data)
                                node.local_predictions.append(local_prediction)
                                
                                # Limit predictions buffer
                                if len(node.local_predictions) > 100:
                                    node.local_predictions = node.local_predictions[-100:]
                            
                            # Update heartbeat
                            node.last_heartbeat = datetime.utcnow()
                
                await asyncio.sleep(60)  # Process every minute
                
            except Exception as e:
                logger.error(f"Error in edge processing: {e}")
                await asyncio.sleep(60)
    
    async def _alert_processing_loop(self):
        """Process and escalate alerts"""
        while True:
            try:
                # Process pending alerts
                for alert in self.alerts[-10:]:  # Process recent alerts
                    if alert.alert_level in [AlertLevel.CRITICAL, AlertLevel.EMERGENCY]:
                        await self._escalate_alert(alert)
                
                await asyncio.sleep(30)  # Process every 30 seconds
                
            except Exception as e:
                logger.error(f"Error in alert processing: {e}")
                await asyncio.sleep(30)
    
    def _generate_sensor_reading(self, device_id: str, sensor_type: SensorType, location: Dict[str, float]) -> SensorReading:
        """Generate realistic sensor reading"""
        current_time = datetime.utcnow()
        sensor_id = f"{device_id}_{sensor_type.value}"
        
        # Generate values based on sensor type
        if sensor_type == SensorType.TEMPERATURE:
            value = np.random.normal(25, 5)  # 25°C ± 5°C
            unit = "°C"
        elif sensor_type == SensorType.HUMIDITY:
            value = np.random.normal(60, 15)  # 60% ± 15%
            unit = "%"
        elif sensor_type == SensorType.WIND_SPEED:
            value = np.random.exponential(5)  # Exponential distribution
            unit = "m/s"
        elif sensor_type == SensorType.WIND_DIRECTION:
            value = np.random.uniform(0, 360)  # 0-360 degrees
            unit = "degrees"
        elif sensor_type == SensorType.SMOKE_DETECTOR:
            value = np.random.uniform(0, 1)  # 0-1 probability
            unit = "probability"
        elif sensor_type == SensorType.FLAME_DETECTOR:
            value = np.random.uniform(0, 1)  # 0-1 probability
            unit = "probability"
        elif sensor_type == SensorType.MOISTURE:
            value = np.random.normal(15, 5)  # 15% ± 5%
            unit = "%"
        elif sensor_type == SensorType.AIR_QUALITY:
            value = np.random.normal(50, 20)  # AQI
            unit = "AQI"
        else:
            value = np.random.normal(0, 1)
            unit = "units"
        
        return SensorReading(
            sensor_id=sensor_id,
            sensor_type=sensor_type,
            value=max(0, value),  # Ensure non-negative
            unit=unit,
            timestamp=current_time,
            location=location,
            metadata={
                "device_id": device_id,
                "calibration_date": (current_time - timedelta(days=30)).isoformat(),
                "sensor_model": f"Model_{sensor_type.value.upper()}_v2"
            },
            quality_score=np.random.uniform(0.8, 1.0)
        )
    
    async def _process_sensor_reading(self, reading: SensorReading):
        """Process individual sensor reading"""
        try:
            # Use appropriate processor
            if reading.sensor_type in self.data_processors:
                await self.data_processors[reading.sensor_type](reading)
        
        except Exception as e:
            logger.error(f"Error processing sensor reading: {e}")
    
    async def _process_temperature_data(self, reading: SensorReading):
        """Process temperature sensor data"""
        # Check for extreme temperatures
        if reading.value > 40:  # High temperature threshold
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.WARNING,
                message=f"High temperature detected: {reading.value:.1f}°C",
                location=reading.location,
                confidence=0.8,
                sensor_readings=[asdict(reading)]
            )
    
    async def _process_humidity_data(self, reading: SensorReading):
        """Process humidity sensor data"""
        # Check for low humidity (fire risk)
        if reading.value < 30:  # Low humidity threshold
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.INFO,
                message=f"Low humidity detected: {reading.value:.1f}%",
                location=reading.location,
                confidence=0.7,
                sensor_readings=[asdict(reading)]
            )
    
    async def _process_wind_data(self, reading: SensorReading):
        """Process wind sensor data"""
        # Check for high wind speeds
        if reading.value > 15:  # High wind threshold
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.WARNING,
                message=f"High wind speed detected: {reading.value:.1f} m/s",
                location=reading.location,
                confidence=0.8,
                sensor_readings=[asdict(reading)]
            )
    
    async def _process_smoke_data(self, reading: SensorReading):
        """Process smoke detector data"""
        # Check for smoke detection
        if reading.value > 0.7:  # High smoke probability
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.CRITICAL,
                message=f"Smoke detected with {reading.value*100:.1f}% confidence",
                location=reading.location,
                confidence=reading.value,
                sensor_readings=[asdict(reading)]
            )
    
    async def _process_flame_data(self, reading: SensorReading):
        """Process flame detector data"""
        # Check for flame detection
        if reading.value > 0.6:  # High flame probability
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.EMERGENCY,
                message=f"Flame detected with {reading.value*100:.1f}% confidence",
                location=reading.location,
                confidence=reading.value,
                sensor_readings=[asdict(reading)]
            )
    
    async def _process_camera_data(self, reading: SensorReading):
        """Process camera data"""
        # Simulate image analysis
        if np.random.random() < 0.01:  # 1% chance of detection
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.WARNING,
                message="Potential fire detected in camera feed",
                location=reading.location,
                confidence=0.6,
                sensor_readings=[asdict(reading)]
            )
    
    async def _process_thermal_camera_data(self, reading: SensorReading):
        """Process thermal camera data"""
        # Check for thermal anomalies
        if reading.value > 50:  # High thermal reading
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.CRITICAL,
                message=f"Thermal anomaly detected: {reading.value:.1f}°C",
                location=reading.location,
                confidence=0.85,
                sensor_readings=[asdict(reading)]
            )
    
    async def _process_weather_station_data(self, reading: SensorReading):
        """Process weather station data"""
        # Comprehensive weather analysis would go here
        pass
    
    async def _process_air_quality_data(self, reading: SensorReading):
        """Process air quality data"""
        # Check for poor air quality (possible fire)
        if reading.value > 100:  # Unhealthy AQI
            await self._create_alert(
                device_id=reading.metadata["device_id"],
                sensor_type=reading.sensor_type,
                alert_level=AlertLevel.WARNING,
                message=f"Poor air quality detected: AQI {reading.value:.0f}",
                location=reading.location,
                confidence=0.7,
                sensor_readings=[asdict(reading)]
            )
    
    async def _create_alert(self, device_id: str, sensor_type: SensorType, alert_level: AlertLevel,
                          message: str, location: Dict[str, float], confidence: float,
                          sensor_readings: List[Dict] = None):
        """Create and process alert"""
        alert = IoTAlert(
            device_id=device_id,
            sensor_type=sensor_type,
            alert_level=alert_level,
            message=message,
            location=location,
            sensor_readings=sensor_readings or [],
            confidence=confidence,
            recommended_actions=self._get_recommended_actions(alert_level, sensor_type)
        )
        
        self.alerts.append(alert)
        
        # Notify alert callbacks
        for callback in self.alert_callbacks:
            try:
                await callback(alert)
            except Exception as e:
                logger.error(f"Error in alert callback: {e}")
        
        logger.info(f"Alert created: {alert.message} (Level: {alert_level.value})")
    
    def _get_alert_thresholds(self, sensors: List[SensorType]) -> Dict[str, float]:
        """Get alert thresholds for sensors"""
        thresholds = {}
        for sensor in sensors:
            if sensor == SensorType.TEMPERATURE:
                thresholds["temperature_high"] = 40.0
            elif sensor == SensorType.HUMIDITY:
                thresholds["humidity_low"] = 30.0
            elif sensor == SensorType.WIND_SPEED:
                thresholds["wind_high"] = 15.0
            elif sensor == SensorType.SMOKE_DETECTOR:
                thresholds["smoke_threshold"] = 0.7
            elif sensor == SensorType.FLAME_DETECTOR:
                thresholds["flame_threshold"] = 0.6
        return thresholds
    
    def _get_recommended_actions(self, alert_level: AlertLevel, sensor_type: SensorType) -> List[str]:
        """Get recommended actions for alert"""
        actions = []
        
        if alert_level in [AlertLevel.CRITICAL, AlertLevel.EMERGENCY]:
            actions.extend([
                "Notify emergency services",
                "Activate evacuation procedures",
                "Deploy firefighting resources"
            ])
        
        if alert_level == AlertLevel.WARNING:
            actions.extend([
                "Increase monitoring frequency",
                "Prepare response teams",
                "Notify relevant authorities"
            ])
        
        if sensor_type in [SensorType.SMOKE_DETECTOR, SensorType.FLAME_DETECTOR]:
            actions.append("Verify with visual inspection")
        
        return actions
    
    def _get_local_sensor_data(self, node_location: Dict[str, float]) -> List[SensorReading]:
        """Get recent sensor data near edge node"""
        local_data = []
        for reading in self.sensor_readings[-100:]:  # Last 100 readings
            distance = np.sqrt(
                (reading.location["lat"] - node_location["lat"])**2 +
                (reading.location["lon"] - node_location["lon"])**2
            )
            if distance < 0.1:  # Within 0.1 degree
                local_data.append(reading)
        return local_data
    
    async def _run_edge_ml_processing(self, sensor_data: List[SensorReading]) -> Dict[str, Any]:
        """Run ML processing on edge node"""
        if not sensor_data:
            return {"prediction": "no_data", "confidence": 0.0}
        
        # Simulate edge ML processing
        temperature_readings = [r.value for r in sensor_data if r.sensor_type == SensorType.TEMPERATURE]
        humidity_readings = [r.value for r in sensor_data if r.sensor_type == SensorType.HUMIDITY]
        
        if temperature_readings and humidity_readings:
            avg_temp = np.mean(temperature_readings)
            avg_humidity = np.mean(humidity_readings)
            
            # Simple fire risk calculation
            fire_risk = (avg_temp / 50) * (1 - avg_humidity / 100)
            fire_risk = min(max(fire_risk, 0.0), 1.0)
            
            return {
                "prediction": "fire_risk",
                "risk_score": fire_risk,
                "confidence": 0.8,
                "timestamp": datetime.utcnow().isoformat(),
                "factors": {
                    "avg_temperature": avg_temp,
                    "avg_humidity": avg_humidity
                }
            }
        
        return {"prediction": "insufficient_data", "confidence": 0.0}
    
    async def _escalate_alert(self, alert: IoTAlert):
        """Escalate critical alerts"""
        # In production, this would integrate with emergency services
        logger.warning(f"ESCALATED ALERT: {alert.message} at {alert.location}")
    
    async def _process_incoming_sensor_data(self, data: Dict[str, Any]):
        """Process incoming sensor data from devices"""
        try:
            device_id = data.get("device_id")
            sensor_readings = data.get("sensor_readings", [])
            
            for reading_data in sensor_readings:
                reading = SensorReading(
                    sensor_id=reading_data["sensor_id"],
                    sensor_type=SensorType(reading_data["sensor_type"]),
                    value=reading_data["value"],
                    unit=reading_data["unit"],
                    timestamp=datetime.fromisoformat(reading_data["timestamp"]),
                    location=reading_data["location"],
                    metadata=reading_data.get("metadata", {}),
                    quality_score=reading_data.get("quality_score", 1.0)
                )
                
                self.sensor_readings.append(reading)
                await self._process_sensor_reading(reading)
        
        except Exception as e:
            logger.error(f"Error processing incoming sensor data: {e}")
    
    def register_alert_callback(self, callback: Callable):
        """Register callback for alert notifications"""
        self.alert_callbacks.append(callback)
    
    def get_device_status(self, device_id: str) -> Optional[IoTDevice]:
        """Get device status"""
        return self.devices.get(device_id)
    
    def get_recent_alerts(self, limit: int = 50) -> List[IoTAlert]:
        """Get recent alerts"""
        return self.alerts[-limit:]
    
    def get_sensor_data_summary(self) -> Dict[str, Any]:
        """Get summary of sensor data"""
        total_readings = len(self.sensor_readings)
        recent_readings = [r for r in self.sensor_readings if 
                          (datetime.utcnow() - r.timestamp).seconds < 3600]  # Last hour
        
        sensor_types = {}
        for reading in recent_readings:
            sensor_type = reading.sensor_type.value
            if sensor_type not in sensor_types:
                sensor_types[sensor_type] = {"count": 0, "avg_value": 0, "values": []}
            sensor_types[sensor_type]["count"] += 1
            sensor_types[sensor_type]["values"].append(reading.value)
        
        for sensor_type, data in sensor_types.items():
            data["avg_value"] = np.mean(data["values"])
            data["min_value"] = np.min(data["values"])
            data["max_value"] = np.max(data["values"])
            del data["values"]  # Remove raw values for cleaner output
        
        return {
            "total_readings": total_readings,
            "recent_readings_count": len(recent_readings),
            "active_devices": len([d for d in self.devices.values() if d.status == SensorStatus.ONLINE]),
            "total_devices": len(self.devices),
            "sensor_types_summary": sensor_types,
            "total_alerts": len(self.alerts),
            "recent_alerts": len([a for a in self.alerts if 
                                (datetime.utcnow() - a.timestamp).seconds < 3600])
        }

# Global IoT integration manager instance
iot_manager = IoTIntegrationManager()
