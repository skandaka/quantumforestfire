import asyncio
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
from dotenv import load_dotenv
import logging

# Load environment variables from .env file FIRST
load_dotenv()

# Import project modules
from backend.config import get_settings
from backend.api.prediction_endpoints import router as prediction_router
from backend.data_pipeline.real_time_feeds import RealTimeDataFeeds
from backend.quantum_models.quantum_simulator import QuantumSimulatorManager
from backend.utils.performance_monitor import PerformanceMonitor

# Application Setup
app = FastAPI(
    title="Quantum Fire Prediction API",
    description="API for running quantum fire spread and ember dynamics simulations.",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins for simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Global State Management and App Lifespan
@app.on_event("startup")
async def startup_event():
    """Initialize all necessary services on application startup."""
    settings = get_settings()
    logging.basicConfig(level=settings.LOG_LEVEL.upper())

    app.state.settings = settings
    app.state.performance_monitor = PerformanceMonitor()
    app.state.quantum_simulator = QuantumSimulatorManager(settings)
    app.state.data_feeds = RealTimeDataFeeds(settings)

    # Start background tasks
    asyncio.create_task(app.state.data_feeds.run_simulated_stream())
    logging.info("Application startup complete.")


@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown."""
    if app.state.data_feeds:
        app.state.data_feeds.stop()
    logging.info("Application shutdown complete.")


# API Routers
app.include_router(prediction_router, prefix="/api/v1", tags=["Predictions"])


# WebSocket Endpoint
@app.websocket("/ws/predictions")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    data_feeds: RealTimeDataFeeds = websocket.app.state.data_feeds
    queue = asyncio.Queue()
    data_feeds.add_listener(queue)

    try:
        while True:
            data = await queue.get()
            await websocket.send_json(data)
    except WebSocketDisconnect:
        logging.info("WebSocket client disconnected.")
    finally:
        data_feeds.remove_listener(queue)


# Health Check Endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """Check the health of the application and its components."""
    is_running = app.state.data_feeds.is_running() if hasattr(app.state, 'data_feeds') else False
    return {
        "status": "healthy",
        "services": {
            "quantum_simulator": "active",
            "data_feeds": "active" if is_running else "inactive"
        }
    }