import asyncio
import json
import logging
import signal
import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, Dict

import redis.asyncio as redis
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.data_endpoints import router as data_router
from api.prediction_endpoints import router as prediction_router
from config import settings
from data_pipeline.real_time_feeds import RealTimeDataManager
from quantum_models.quantum_simulator import QuantumSimulatorManager
from utils.classiq_utils import ClassiqManager
from utils.performance_monitor import PerformanceMonitor

# --- Logging Configuration ---
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("main")

# --- Global State Dictionary ---
app_state: Dict[str, Any] = {}


# --- Graceful Shutdown Handler ---
async def shutdown(sig: signal.Signals, app: FastAPI):
    """
    Handles graceful shutdown of the application upon receiving a signal.
    """
    logger.warning(f"Received shutdown signal: {sig.name}. Starting graceful shutdown...")

    tasks = app_state.get("background_tasks", [])
    for task in tasks:
        if not task.done():
            task.cancel()

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)

    if "performance_monitor" in app_state:
        app_state["performance_monitor"].stop()
        logger.info("Performance Monitor stopped.")

    if "data_manager" in app_state:
        await app_state["data_manager"].stop_streaming()
        logger.info("Data Manager streaming stopped.")

    if "redis_pool" in app_state:
        await app_state["redis_pool"].disconnect()
        logger.info("Redis connection pool disconnected.")

    logger.warning("✅ Graceful shutdown complete. Exiting.")
    sys.exit(0)


# --- Application Lifecycle (Lifespan Manager) ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events using FastAPI's lifespan context.
    """
    logger.info("=" * 50)
    logger.info("🔥 Quantum Fire Prediction System Starting Up...")
    logger.info("=" * 50)

    try:
        logger.info("Connecting to Redis at %s...", settings.REDIS_URL)
        redis_pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
        app_state["redis_pool"] = redis_pool

        logger.info("📡 Initializing Real-Time Data Manager...")
        app_state["data_manager"] = RealTimeDataManager(redis_pool)
        await app_state["data_manager"].initialize_redis()

        logger.info("🌌 Initializing Quantum Simulator Manager...")
        app_state["simulator_manager"] = QuantumSimulatorManager()

        logger.info("🚀 Initializing Classiq Integration...")
        app_state["classiq_manager"] = ClassiqManager()
        await app_state["classiq_manager"].initialize()

        logger.info("📊 Starting Performance Monitoring...")
        app_state["performance_monitor"] = PerformanceMonitor()
        app_state["performance_monitor"].start()

        if settings.USE_REAL_QUANTUM_BACKENDS:
            logger.info("Attempting to initialize REAL quantum backends...")
            simulator_manager = QuantumSimulatorManager(use_real_backends=True)
            await simulator_manager.initialize_backends()
            app_state["simulator_manager"] = simulator_manager
            backend_count = len(simulator_manager.get_available_backends())
            logger.info(f"✅ Quantum system initialized with {backend_count} real backends.")
        else:
            logger.info("Running with simulated quantum backends.")

        logger.info("Starting background tasks for data collection and prediction...")
        data_collection_task = asyncio.create_task(data_collection_loop())
        prediction_task = asyncio.create_task(quantum_prediction_loop())
        app_state["background_tasks"] = [data_collection_task, prediction_task]

        app.state.app_state = app_state

        logger.info("✅ All systems initialized successfully! Application is ready.")

    except Exception as e:
        logger.critical(f"🚨 CRITICAL ERROR DURING STARTUP: {e}", exc_info=True)
        raise

    yield

    # --- Shutdown Logic ---
    logger.info("=" * 50)
    logger.info("🔥 Quantum Fire Prediction System Shutting Down...")
    logger.info("=" * 50)

    tasks = app_state.get("background_tasks", [])
    for task in tasks:
        if not task.done():
            task.cancel()
            logger.info(f"Cancelled background task: {task.get_name()}")

    if tasks:
        await asyncio.gather(*tasks, return_exceptions=True)
        logger.info("All background tasks have been terminated.")

    if "performance_monitor" in app_state:
        app_state["performance_monitor"].stop()
        logger.info("Performance Monitor stopped.")

    if "data_manager" in app_state:
        await app_state["data_manager"].stop_streaming()
        logger.info("Data Manager streaming stopped.")

    if "redis_pool" in app_state:
        await app_state["redis_pool"].disconnect()
        logger.info("Redis connection pool disconnected.")

    logger.info("✅ System shutdown complete.")


# --- FastAPI App Instantiation ---
app = FastAPI(
    title="Quantum Fire Prediction API",
    description="An advanced API for running quantum-powered wildfire simulations, integrating real-time data and sophisticated predictive models.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# --- Middleware Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # Use the validated settings
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --- Custom Exception Handler ---
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception for request {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


# --- API Routers ---
API_V1_PREFIX = "/api/v1"
app.include_router(prediction_router, prefix=API_V1_PREFIX, tags=["Prediction Engine"])
app.include_router(data_router, prefix=API_V1_PREFIX, tags=["Real-Time Data"])


# --- Background Task Loops ---
async def data_collection_loop():
    await asyncio.sleep(5)
    data_manager: RealTimeDataManager = app_state["data_manager"]
    while True:
        try:
            logger.info("Running data collection cycle...")
            processed_data = await data_manager.collect_and_process_data()
            if processed_data:
                await data_manager.redis_client.set(
                    "latest_processed_data",
                    json.dumps(processed_data, default=str)
                )
                await data_manager._broadcast_to_streams(
                    {'type': 'data_update', 'data': processed_data}, 'data_updates'
                )
        except Exception as e:
            logger.error(f"Error in data collection loop: {e}", exc_info=True)

        await asyncio.sleep(settings.DATA_COLLECTION_INTERVAL_SECONDS)


async def quantum_prediction_loop():
    await asyncio.sleep(10)
    simulator: QuantumSimulatorManager = app_state["simulator_manager"]
    data_manager: RealTimeDataManager = app_state["data_manager"]
    while True:
        try:
            logger.info("Running new automated quantum prediction cycle...")
            latest_data = await data_manager.get_latest_data()

            if latest_data:
                prediction = await simulator.run_ensemble_prediction(latest_data)
                await data_manager.store_prediction(prediction)
                logger.info("Automated quantum prediction cycle completed and stored.")
            else:
                logger.warning("Skipping prediction cycle: no real-time data available.")
        except Exception as e:
            logger.error(f"Error in quantum prediction loop: {e}", exc_info=True)

        await asyncio.sleep(settings.PREDICTION_INTERVAL_SECONDS)


# --- Root Endpoint ---
@app.get("/", tags=["Root"], summary="API Root and Health Check")
async def read_root():
    return {
        "status": "ok",
        "message": "Welcome to the Quantum Fire Prediction API",
        "version": app.version,
        "docs_url": app.docs_url,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


# --- Main Entry Point for Running with `python main.py` ---
if __name__ == "__main__":
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        loop.add_signal_handler(sig, lambda sig=sig: asyncio.create_task(shutdown(sig, app)))

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        lifespan="on",
    )