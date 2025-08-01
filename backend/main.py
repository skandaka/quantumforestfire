"""
Quantum Fire Prediction System - Main API Server
Location: backend/main.py
"""

import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from typing import List

import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# --- Local Imports ---
# Import routers and manager classes
from api import (
    prediction_endpoints,
    validation_endpoints,
    data_endpoints,
    quantum_endpoints,
    classiq_endpoints
)
from config import settings # Assuming a Pydantic settings file
from data_pipeline.real_time_feeds import RealTimeDataManager
from quantum_models.quantum_simulator import QuantumSimulatorManager
from utils.classiq_utils import ClassiqManager
from utils.performance_monitor import PerformanceMonitor

# --- Logging Configuration ---
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# --- Application Lifespan Management ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events. This is the recommended
    way to handle resources that need to be available for the entire app lifecycle.
    """
    # --- Startup ---
    logger.info("🔥 Quantum Fire Prediction System Starting...")

    # Initialize managers and store them in the application state
    logger.info("📡 Initializing real-time data feeds...")
    app.state.data_manager = RealTimeDataManager()
    await app.state.data_manager.initialize()

    logger.info("🌌 Initializing quantum simulators...")
    app.state.quantum_manager = QuantumSimulatorManager()
    await app.state.quantum_manager.initialize()

    logger.info("🚀 Initializing Classiq integration...")
    app.state.classiq_manager = ClassiqManager()
    await app.state.classiq_manager.initialize()

    logger.info("📊 Starting performance monitoring...")
    app.state.performance_monitor = PerformanceMonitor()
    await app.state.performance_monitor.start()

    # Initialize a shared list for active WebSocket connections
    app.state.active_websockets: List[WebSocket] = []

    # The loop functions are defined below main app creation
    app.state.background_tasks = [
        asyncio.create_task(data_collection_loop(app.state.data_manager)),
        asyncio.create_task(quantum_prediction_loop(app)),
        asyncio.create_task(websocket_broadcast_loop(app))
    ]

    logger.info("✅ All systems initialized successfully!")

    yield # The application runs here

    # --- Shutdown ---
    logger.info("👋 Shutting down Quantum Fire Prediction System...")

    # Gracefully cancel all background tasks
    for task in app.state.background_tasks:
        task.cancel()
        try:
            await task
        except asyncio.CancelledError:
            logger.info(f"Task {task.get_name()} cancelled successfully.")

    # Properly close all active WebSocket connections
    for ws in app.state.active_websockets:
        await ws.close(code=1001, reason="Server is shutting down")

    # Clean up manager resources
    await app.state.data_manager.shutdown()
    await app.state.quantum_manager.shutdown()
    await app.state.classiq_manager.shutdown()
    await app.state.performance_monitor.stop()

    logger.info("🔒 Shutdown complete.")


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Quantum Fire Prediction System",
    description="Revolutionary wildfire prediction using quantum computing and the Classiq platform.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# --- Middleware ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.debug else settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Custom exception handler to log errors and return a clean response."""
    logger.error(f"Unhandled exception on path {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal Server Error",
            "message": str(exc) if settings.debug else "An unexpected error occurred.",
            "timestamp": datetime.utcnow().isoformat()
        }
    )
@app.get("/api/metrics", tags=["System"])
async def get_metrics(request: Request):
    """Get system performance metrics"""
    return await request.app.state.performance_monitor.get_metrics()
# --- API Routers ---
app.include_router(prediction_endpoints.router, prefix="/api/predictions", tags=["Predictions"])
app.include_router(validation_endpoints.router, prefix="/api/validation", tags=["Validation"])
app.include_router(data_endpoints.router, prefix="/api/data", tags=["Data"])
app.include_router(quantum_endpoints.router, prefix="/api/quantum", tags=["Quantum"])
app.include_router(classiq_endpoints.router, prefix="/api/classiq", tags=["Classiq"])


# --- Core Endpoints ---
@app.get("/", tags=["System"])
async def root(request: Request):
    """Provides a summary of the system status and capabilities."""
    return {
        "system": "Quantum Fire Prediction System",
        "status": "operational",
        "timestamp": datetime.utcnow().isoformat(),
        "capabilities": {
            "quantum_backends": await request.app.state.quantum_manager.get_available_backends(),
            "data_sources": list(request.app.state.data_manager.collectors.keys()),
            "performance": await request.app.state.performance_monitor.get_metrics()
        }
    }

@app.get("/health", tags=["System"])
async def health_check(request: Request):
    """Performs a detailed health check of all system components."""
    components = {
        "api": "operational",
        "quantum_simulator": "operational" if request.app.state.quantum_manager.is_healthy() else "degraded",
        "classiq_integration": "operational" if request.app.state.classiq_manager.is_connected() else "degraded",
        "data_pipeline": "operational" if request.app.state.data_manager.is_healthy() else "degraded",
    }
    overall_status = "healthy" if all(s == "operational" for s in components.values()) else "degraded"
    return {
        "status": overall_status,
        "timestamp": datetime.utcnow().isoformat(),
        "components": components,
        "metrics": {
            "uptime_seconds": request.app.state.performance_monitor.get_uptime(),
            "active_connections": len(request.app.state.active_websockets)
        }
    }


# --- WebSocket Management ---
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Handles real-time updates for fire predictions and system metrics."""
    await websocket.accept()
    websocket.app.state.active_websockets.append(websocket)
    try:
        await websocket.send_json({"type": "status", "message": "Connection established."})
        while True:
            # Keep connection open and listen for client messages if needed
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    finally:
        if websocket in websocket.app.state.active_websockets:
            websocket.app.state.active_websockets.remove(websocket)


# --- Background Task Loops ---
async def data_collection_loop(data_manager: RealTimeDataManager):
    """Periodically collects data from all configured sources."""
    while True:
        try:
            logger.info("Starting data collection cycle...")
            await data_manager.collect_all_data()
        except Exception as e:
            logger.error(f"Error in data collection loop: {e}", exc_info=True)
        await asyncio.sleep(settings.data_collection_interval)

async def quantum_prediction_loop(app: FastAPI):
    """Periodically runs quantum predictions based on the latest data."""
    while True:
        try:
            fire_data = await app.state.data_manager.get_latest_fire_data()
            weather_data = await app.state.data_manager.get_latest_weather_data()

            if fire_data and weather_data:
                logger.info("Running new quantum prediction cycle...")
                prediction = await app.state.quantum_manager.run_ensemble_prediction(fire_data, weather_data)
                await app.state.data_manager.store_prediction(prediction)
                await broadcast_to_all(app.state.active_websockets, {"type": "prediction", "data": prediction})
        except Exception as e:
            logger.error(f"Error in quantum prediction loop: {e}", exc_info=True)
        await asyncio.sleep(settings.prediction_interval)

async def websocket_broadcast_loop(app: FastAPI):
    """Periodically broadcasts system metrics to all connected clients."""
    while True:
        try:
            metrics = await app.state.performance_monitor.get_metrics()
            await broadcast_to_all(app.state.active_websockets, {"type": "metrics", "data": metrics})
        except Exception as e:
            logger.error(f"Error in WebSocket broadcast loop: {e}", exc_info=True)
        await asyncio.sleep(settings.metrics_broadcast_interval)

async def broadcast_to_all(websockets: List[WebSocket], message: dict):
    """Sends a JSON message to all active WebSocket clients."""
    message["timestamp"] = datetime.utcnow().isoformat()
    # Create a copy of the list to handle disconnections during iteration
    for websocket in list(websockets):
        try:
            await websocket.send_json(message)
        except (WebSocketDisconnect, RuntimeError):
            # The client disconnected, remove them from the list
            if websocket in websockets:
                websockets.remove(websocket)


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug,
        log_level="info"
    )