import asyncio
import logging
from contextlib import asynccontextmanager
from typing import Any, Dict

import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# --- CORRECTED IMPORTS (removed 'app.' prefix) ---
from api import data_endpoints, prediction_endpoints, quantum_endpoints, classiq_endpoints, validation_endpoints
from config import settings
from data_pipeline.real_time_feeds import RealTimeDataManager
from quantum_models.quantum_simulator import QuantumSimulatorManager
from utils.classiq_utils import ClassiqManager
from utils.performance_monitor import PerformanceMonitor
import managers

# --- Logging Configuration ---
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("main")


# --- Application Lifespan (Startup and Shutdown) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events.
    """
    logger.info("=" * 50)
    logger.info("🔥 Quantum Fire Prediction System Starting Up...")
    logger.info("=" * 50)

    # --- Initialize Services ---
    # Create a Redis connection pool
    managers.redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)

    # Initialize managers
    managers.data_manager = RealTimeDataManager(managers.redis_pool)
    managers.quantum_manager = QuantumSimulatorManager()
    managers.classiq_manager = ClassiqManager()
    managers.performance_monitor = PerformanceMonitor()

    # Asynchronous initializations
    await managers.data_manager.initialize_collectors()
    await managers.quantum_manager.initialize()
    await managers.classiq_manager.initialize()
    await managers.performance_monitor.start()

    # Pass managers to the app state so endpoints can access them
    app.state.data_manager = managers.data_manager
    app.state.quantum_manager = managers.quantum_manager
    app.state.classiq_manager = managers.classiq_manager

    logger.info("✅ All systems initialized successfully! Application is ready.")

    yield

    # --- Shutdown Logic ---
    logger.info("🔥 Quantum Fire Prediction System Shutting Down...")
    await managers.performance_monitor.stop()
    if managers.redis_pool:
        await managers.redis_pool.disconnect()
    logger.info("✅ System shutdown complete.")


# --- FastAPI App Initialization ---
app = FastAPI(
    title="Quantum Fire Prediction API",
    description="An advanced API for running quantum-powered wildfire simulations.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# --- Add CORS Middleware ---
# This allows the frontend to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- API Routers ---
app.include_router(data_endpoints.router, prefix="/api/v1", tags=["Data Feeds"])
app.include_router(prediction_endpoints.router, prefix="/api/v1", tags=["Prediction Engine"])
app.include_router(quantum_endpoints.router, prefix="/api/v1/quantum", tags=["Quantum System"])
app.include_router(classiq_endpoints.router, prefix="/api/v1/classiq", tags=["Classiq Platform"])
app.include_router(validation_endpoints.router, prefix="/api/v1/validation", tags=["Validation"])


# --- Root Endpoint ---
@app.get("/", tags=["Root"])
async def read_root():
    return {"message": "Welcome to the Quantum Fire Prediction API"}


# --- Main execution block ---
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )