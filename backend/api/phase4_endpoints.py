"""
Phase 4 API Endpoints - Advanced Analytics and IoT Integration
"""
from fastapi import APIRouter, HTTPException, Query, Depends
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
import json
import asyncio
from pydantic import BaseModel

from analytics.advanced_analytics_engine import analytics_engine, RiskLevel, TrendDirection
from iot.iot_integration_manager import iot_manager, SensorType, AlertLevel

router = APIRouter(prefix="/api/v1/phase4", tags=["Phase 4 - Analytics & IoT"])

# Pydantic models for request/response
class AnalyticsRequest(BaseModel):
    time_window_days: int = 90
    location_bounds: Optional[Dict[str, float]] = None

class RiskPredictionRequest(BaseModel):
    prediction_horizon_hours: int = 72
    location: Optional[List[float]] = None

class RiskMapRequest(BaseModel):
    grid_resolution: float = 0.01
    bounds: Optional[Dict[str, float]] = None

class IoTDeviceConfig(BaseModel):
    device_name: str
    device_type: str
    location: Dict[str, float]
    sensors: List[str]
    configuration: Dict[str, Any]

# Analytics Endpoints
@router.get("/analytics/trends")
async def get_historical_trends(
    time_window_days: int = Query(default=90, ge=1, le=365),
    min_lat: Optional[float] = Query(default=None),
    max_lat: Optional[float] = Query(default=None),
    min_lon: Optional[float] = Query(default=None),
    max_lon: Optional[float] = Query(default=None)
):
    """Get historical fire trends analysis"""
    try:
        location_bounds = None
        if all(coord is not None for coord in [min_lat, max_lat, min_lon, max_lon]):
            location_bounds = {
                "min_lat": min_lat,
                "max_lat": max_lat,
                "min_lon": min_lon,
                "max_lon": max_lon
            }
        
        result = await analytics_engine.analyze_historical_trends(
            time_window_days=time_window_days,
            location_bounds=location_bounds
        )
        
        return {
            "status": "success",
            "data": result.data,
            "confidence": result.confidence,
            "metadata": result.metadata,
            "generated_at": result.timestamp.isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics error: {str(e)}")

@router.post("/analytics/risk-prediction")
async def predict_future_risk(request: RiskPredictionRequest):
    """Predict future fire risk"""
    try:
        location = tuple(request.location) if request.location else None
        
        predictions = await analytics_engine.predict_future_risk(
            prediction_horizon_hours=request.prediction_horizon_hours,
            location=location
        )
        
        return {
            "status": "success",
            "predictions": [
                {
                    "location": pred.location,
                    "risk_level": pred.risk_level.value,
                    "risk_score": pred.risk_score,
                    "probability": pred.probability,
                    "time_window_hours": pred.time_window,
                    "contributing_factors": pred.contributing_factors,
                    "recommendations": pred.recommendations
                }
                for pred in predictions
            ],
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction error: {str(e)}")

@router.post("/analytics/anomaly-detection")
async def detect_anomalies(recent_data: List[Dict[str, Any]]):
    """Detect anomalous patterns in recent data"""
    try:
        anomalies = await analytics_engine.detect_anomalies(recent_data)
        
        return {
            "status": "success",
            "anomalies_detected": len(anomalies),
            "anomalies": anomalies,
            "analyzed_points": len(recent_data),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Anomaly detection error: {str(e)}")

@router.get("/analytics/fire-patterns")
async def get_fire_patterns():
    """Get fire pattern clusters analysis"""
    try:
        patterns = await analytics_engine.cluster_fire_patterns()
        
        return {
            "status": "success",
            "patterns": patterns,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pattern analysis error: {str(e)}")

@router.post("/analytics/risk-map")
async def generate_risk_map(request: RiskMapRequest):
    """Generate fire risk map"""
    try:
        risk_map = await analytics_engine.generate_risk_map(
            grid_resolution=request.grid_resolution,
            bounds=request.bounds
        )
        
        return {
            "status": "success",
            "risk_map": risk_map,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk map generation error: {str(e)}")

@router.get("/analytics/summary")
async def get_analytics_summary():
    """Get comprehensive analytics summary"""
    try:
        # Get cached analytics data
        cache = analytics_engine.analytics_cache
        
        return {
            "status": "success",
            "summary": {
                "last_analysis_run": cache.get("last_run"),
                "recent_trends": cache.get("recent_trends"),
                "risk_predictions": cache.get("risk_predictions"),
                "pattern_clusters": cache.get("pattern_clusters", {}).get("total_clusters", 0),
                "system_status": "operational"
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analytics summary error: {str(e)}")

# IoT Endpoints
@router.get("/iot/devices")
async def get_iot_devices():
    """Get all IoT devices"""
    try:
        devices = list(iot_manager.devices.values())
        
        return {
            "status": "success",
            "devices": [
                {
                    "device_id": device.device_id,
                    "device_name": device.device_name,
                    "device_type": device.device_type,
                    "location": device.location,
                    "status": device.status.value,
                    "last_seen": device.last_seen.isoformat(),
                    "battery_level": device.battery_level,
                    "sensors": [sensor.value for sensor in device.sensors],
                    "network_info": device.network_info
                }
                for device in devices
            ],
            "total_devices": len(devices),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IoT devices error: {str(e)}")

@router.get("/iot/devices/{device_id}")
async def get_iot_device(device_id: str):
    """Get specific IoT device details"""
    try:
        device = iot_manager.get_device_status(device_id)
        
        if not device:
            raise HTTPException(status_code=404, detail="Device not found")
        
        return {
            "status": "success",
            "device": {
                "device_id": device.device_id,
                "device_name": device.device_name,
                "device_type": device.device_type,
                "location": device.location,
                "status": device.status.value,
                "last_seen": device.last_seen.isoformat(),
                "battery_level": device.battery_level,
                "firmware_version": device.firmware_version,
                "sensors": [sensor.value for sensor in device.sensors],
                "network_info": device.network_info,
                "configuration": device.configuration
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Device details error: {str(e)}")

@router.get("/iot/sensor-data")
async def get_sensor_data(
    device_id: Optional[str] = Query(default=None),
    sensor_type: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    hours_back: int = Query(default=24, ge=1, le=168)
):
    """Get sensor data with filtering"""
    try:
        # Filter sensor readings
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_back)
        readings = [
            reading for reading in iot_manager.sensor_readings
            if reading.timestamp >= cutoff_time
        ]
        
        # Apply filters
        if device_id:
            readings = [r for r in readings if r.sensor_id.startswith(device_id)]
        
        if sensor_type:
            try:
                sensor_type_enum = SensorType(sensor_type)
                readings = [r for r in readings if r.sensor_type == sensor_type_enum]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid sensor type: {sensor_type}")
        
        # Limit results
        readings = readings[-limit:]
        
        return {
            "status": "success",
            "readings": [
                {
                    "sensor_id": reading.sensor_id,
                    "sensor_type": reading.sensor_type.value,
                    "value": reading.value,
                    "unit": reading.unit,
                    "timestamp": reading.timestamp.isoformat(),
                    "location": reading.location,
                    "quality_score": reading.quality_score,
                    "metadata": reading.metadata
                }
                for reading in readings
            ],
            "total_readings": len(readings),
            "filters_applied": {
                "device_id": device_id,
                "sensor_type": sensor_type,
                "hours_back": hours_back
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sensor data error: {str(e)}")

@router.get("/iot/alerts")
async def get_iot_alerts(
    alert_level: Optional[str] = Query(default=None),
    device_id: Optional[str] = Query(default=None),
    limit: int = Query(default=50, ge=1, le=200),
    hours_back: int = Query(default=24, ge=1, le=168)
):
    """Get IoT alerts with filtering"""
    try:
        # Get recent alerts
        cutoff_time = datetime.utcnow() - timedelta(hours=hours_back)
        alerts = [
            alert for alert in iot_manager.alerts
            if alert.timestamp >= cutoff_time
        ]
        
        # Apply filters
        if alert_level:
            try:
                alert_level_enum = AlertLevel(alert_level)
                alerts = [a for a in alerts if a.alert_level == alert_level_enum]
            except ValueError:
                raise HTTPException(status_code=400, detail=f"Invalid alert level: {alert_level}")
        
        if device_id:
            alerts = [a for a in alerts if a.device_id == device_id]
        
        # Limit results
        alerts = alerts[-limit:]
        
        return {
            "status": "success",
            "alerts": [
                {
                    "alert_id": alert.alert_id,
                    "device_id": alert.device_id,
                    "sensor_type": alert.sensor_type.value,
                    "alert_level": alert.alert_level.value,
                    "message": alert.message,
                    "timestamp": alert.timestamp.isoformat(),
                    "location": alert.location,
                    "confidence": alert.confidence,
                    "recommended_actions": alert.recommended_actions,
                    "sensor_readings_count": len(alert.sensor_readings)
                }
                for alert in alerts
            ],
            "total_alerts": len(alerts),
            "filters_applied": {
                "alert_level": alert_level,
                "device_id": device_id,
                "hours_back": hours_back
            },
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IoT alerts error: {str(e)}")

@router.get("/iot/summary")
async def get_iot_summary():
    """Get IoT system summary"""
    try:
        summary = iot_manager.get_sensor_data_summary()
        
        return {
            "status": "success",
            "summary": summary,
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"IoT summary error: {str(e)}")

@router.get("/iot/edge-nodes")
async def get_edge_nodes():
    """Get edge computing nodes status"""
    try:
        nodes = list(iot_manager.edge_nodes.values())
        
        return {
            "status": "success",
            "edge_nodes": [
                {
                    "node_id": node.node_id,
                    "location": node.location,
                    "status": node.status.value,
                    "processing_capacity": node.processing_capacity,
                    "connected_devices": len(node.connected_devices),
                    "last_heartbeat": node.last_heartbeat.isoformat(),
                    "recent_predictions": len(node.local_predictions)
                }
                for node in nodes
            ],
            "total_nodes": len(nodes),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edge nodes error: {str(e)}")

@router.get("/iot/edge-nodes/{node_id}/predictions")
async def get_edge_predictions(node_id: str, limit: int = Query(default=20, ge=1, le=100)):
    """Get edge node predictions"""
    try:
        if node_id not in iot_manager.edge_nodes:
            raise HTTPException(status_code=404, detail="Edge node not found")
        
        node = iot_manager.edge_nodes[node_id]
        predictions = node.local_predictions[-limit:]
        
        return {
            "status": "success",
            "node_id": node_id,
            "predictions": predictions,
            "total_predictions": len(predictions),
            "generated_at": datetime.utcnow().isoformat()
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edge predictions error: {str(e)}")

# Real-time streaming endpoints
@router.get("/analytics/stream")
async def stream_analytics():
    """Stream real-time analytics data"""
    async def generate_analytics_stream():
        while True:
            try:
                # Get latest analytics data
                cache = analytics_engine.analytics_cache
                
                data = {
                    "type": "analytics_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "recent_trends": cache.get("recent_trends"),
                        "risk_predictions": cache.get("risk_predictions"),
                        "system_status": "operational"
                    }
                }
                
                yield f"data: {json.dumps(data)}\n\n"
                await asyncio.sleep(30)  # Update every 30 seconds
                
            except Exception as e:
                error_data = {
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e)
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                await asyncio.sleep(30)
    
    return StreamingResponse(
        generate_analytics_stream(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

@router.get("/iot/stream")
async def stream_iot_data():
    """Stream real-time IoT data"""
    async def generate_iot_stream():
        while True:
            try:
                # Get latest IoT data
                summary = iot_manager.get_sensor_data_summary()
                recent_alerts = iot_manager.get_recent_alerts(limit=5)
                
                data = {
                    "type": "iot_update",
                    "timestamp": datetime.utcnow().isoformat(),
                    "data": {
                        "summary": summary,
                        "recent_alerts": [
                            {
                                "alert_id": alert.alert_id,
                                "device_id": alert.device_id,
                                "alert_level": alert.alert_level.value,
                                "message": alert.message,
                                "timestamp": alert.timestamp.isoformat()
                            }
                            for alert in recent_alerts
                        ]
                    }
                }
                
                yield f"data: {json.dumps(data)}\n\n"
                await asyncio.sleep(10)  # Update every 10 seconds
                
            except Exception as e:
                error_data = {
                    "type": "error",
                    "timestamp": datetime.utcnow().isoformat(),
                    "error": str(e)
                }
                yield f"data: {json.dumps(error_data)}\n\n"
                await asyncio.sleep(10)
    
    return StreamingResponse(
        generate_iot_stream(),
        media_type="text/plain",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

# Health check endpoint
@router.get("/health")
async def health_check():
    """Health check for Phase 4 components"""
    try:
        # Check analytics engine
        analytics_healthy = bool(analytics_engine.analytics_cache)
        
        # Check IoT manager
        iot_healthy = len(iot_manager.devices) > 0
        
        # Check edge nodes
        edge_healthy = any(
            node.status.value == "online" 
            for node in iot_manager.edge_nodes.values()
        )
        
        overall_healthy = analytics_healthy and iot_healthy and edge_healthy
        
        return {
            "status": "healthy" if overall_healthy else "degraded",
            "components": {
                "analytics_engine": "healthy" if analytics_healthy else "unhealthy",
                "iot_manager": "healthy" if iot_healthy else "unhealthy",
                "edge_computing": "healthy" if edge_healthy else "unhealthy"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }
