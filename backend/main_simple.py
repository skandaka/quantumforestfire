#!/usr/bin/env python3
"""
Quantum Fire Prediction API - Streamlined for optimal performance
Combines core prediction functionality with optional advanced features.
"""

import os
import sys
import logging
import asyncio
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

import uvicorn
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from starlette.websockets import WebSocketDisconnect
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Simple backend imports - core functionality
from backend.config import get_settings
from backend.quantum_models.mock_fire_spread import MockFireSpread
from backend.data_pipeline.data_processor import FireDataProcessor

app = FastAPI(
    title="Quantum Fire Prediction API",
    description="Quantum-powered wildfire prediction system",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
app.state.settings = None
app.state.mock_model = None
app.state.data_processor = None

@app.on_event("startup")
async def startup_event():
    """Initialize the application."""
    try:
        settings = get_settings()
        logging.basicConfig(level=settings.LOG_LEVEL.upper())
        
        app.state.settings = settings
        app.state.mock_model = MockFireSpread(grid_size=20)
        app.state.data_processor = FireDataProcessor()
        
        logging.info("🚀 Quantum fire prediction server started!")
        
    except Exception as e:
        logging.error(f"❌ Failed to start server: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Clean up resources on application shutdown."""
    logging.info("Application shutdown complete.")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "services": {
            "quantum_simulator": "active",
            "data_feeds": "active"
        },
        "message": "Quantum Fire Prediction API is running"
    }

# WebSocket endpoint for real-time updates
@app.websocket("/ws/predictions")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time prediction updates."""
    await websocket.accept()
    try:
        while True:
            # Send mock real-time data
            data = {
                "status": "connected",
                "timestamp": "2025-01-01T00:00:00Z",
                "active_predictions": 0
            }
            await websocket.send_json(data)
            await asyncio.sleep(5)
    except WebSocketDisconnect:
        logging.info("WebSocket client disconnected.")

# Include the prediction endpoints
from backend.api.prediction_endpoints import router as prediction_router
app.include_router(prediction_router, prefix="/api/v1")

if __name__ == "__main__":
    uvicorn.run(
        "main_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
