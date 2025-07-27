import logging
from fastapi import APIRouter, Depends, HTTPException, Body
from pydantic import BaseModel
from typing import List, Dict, Any

# --- Corrected Imports ---
from backend.quantum_models.quantum_simulator import QuantumSimulatorManager
from backend.utils.classiq_utils import get_classiq_model_details
from backend.config import Settings, get_settings

router = APIRouter()

class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: int
    model_type: str = "classiq_fire_spread"
    parameters: Dict[str, Any] = {}

class EmberPredictionRequest(BaseModel):
    fire_location: List[float]
    wind_speed: float
    wind_direction: float

@router.post("/predict")
async def run_prediction(
    request: PredictionRequest,
    settings: Settings = Depends(get_settings),
    simulator: QuantumSimulatorManager = Depends(lambda: router.app.state.quantum_simulator)
):
    """Run a fire spread prediction."""
    try:
        result = await simulator.run_simulation(
            model_name=request.model_type,
            parameters=request.parameters
        )
        return result
    except Exception as e:
        logging.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Error running prediction simulation.")

@router.post("/predict_embers")
async def run_ember_prediction(
    request: EmberPredictionRequest,
    simulator: QuantumSimulatorManager = Depends(lambda: router.app.state.quantum_simulator)
):
    """Run an ember transport prediction."""
    try:
        result = await simulator.run_simulation(
            model_name="classiq_ember_dynamics",
            parameters=request.dict()
        )
        return result
    except Exception as e:
        logging.error(f"Ember prediction failed: {e}")
        raise HTTPException(status_code=500, detail="Error running ember prediction.")

@router.get("/models")
async def get_available_models(
    simulator: QuantumSimulatorManager = Depends(lambda: router.app.state.quantum_simulator)
):
    """Get a list of available quantum models."""
    return {"models": simulator.list_models()}

@router.get("/models/classiq/{model_name}")
async def get_classiq_model(model_name: str, settings: Settings = Depends(get_settings)):
    """Get details for a specific Classiq model."""
    try:
        details = await get_classiq_model_details(model_name, settings.classiq_api_token)
        return details
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found or Classiq error: {e}")