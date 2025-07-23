"""
Validation API Endpoints
Location: backend/api/validation_endpoints.py
"""

from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/validate/location")
async def validate_location(location: Dict[str, float]) -> Dict[str, Any]:
    """Validate location coordinates"""
    try:
        lat = location.get('latitude')
        lon = location.get('longitude')

        errors = []

        if lat is None or lon is None:
            errors.append("Missing latitude or longitude")
        else:
            if not -90 <= lat <= 90:
                errors.append("Latitude must be between -90 and 90")
            if not -180 <= lon <= 180:
                errors.append("Longitude must be between -180 and 180")

        # Check if location is in supported area (California for now)
        supported = False
        if 32.5 <= lat <= 42.0 and -124.5 <= lon <= -114.0:
            supported = True

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'supported_area': supported,
            'location': location
        }
    except Exception as e:
        logger.error(f"Error validating location: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/validate/prediction-request")
async def validate_prediction_request(request: Dict[str, Any]) -> Dict[str, Any]:
    """Validate a prediction request"""
    try:
        errors = []
        warnings = []

        # Validate location
        if 'location' not in request:
            errors.append("Missing location")

        # Validate radius
        radius = request.get('radius_km', 50)
        if radius <= 0:
            errors.append("Radius must be positive")
        elif radius > 200:
            warnings.append("Large radius may impact performance")

        # Validate time horizon
        time_horizon = request.get('time_horizon_hours', 24)
        if time_horizon <= 0:
            errors.append("Time horizon must be positive")
        elif time_horizon > 72:
            warnings.append("Predictions beyond 72 hours have reduced accuracy")

        # Validate model type
        valid_models = ['classiq_fire_spread', 'classiq_ember_dynamics', 'qiskit_fire_spread', 'ensemble']
        model = request.get('model_type', 'ensemble')
        if model not in valid_models:
            errors.append(f"Invalid model type. Valid options: {valid_models}")

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'request': request
        }
    except Exception as e:
        logger.error(f"Error validating prediction request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/supported-areas")
async def get_supported_areas() -> Dict[str, Any]:
    """Get list of supported geographic areas"""
    return {
        'areas': [
            {
                'name': 'California',
                'bounds': {
                    'north': 42.0,
                    'south': 32.5,
                    'east': -114.0,
                    'west': -124.5
                },
                'active': True,
                'coverage': 'full'
            },
            {
                'name': 'Oregon',
                'bounds': {
                    'north': 46.0,
                    'south': 42.0,
                    'east': -116.5,
                    'west': -124.5
                },
                'active': False,
                'coverage': 'coming_soon'
            }
        ],
        'default_area': 'California'
    }