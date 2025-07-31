"""
Data API Endpoints for Quantum Fire Prediction System
Location: backend/api/data_endpoints.py
"""

import logging
from datetime import datetime
from typing import Dict, Any

from fastapi import APIRouter, Depends, HTTPException, Request

from data_pipeline.real_time_feeds import RealTimeDataManager

logger = logging.getLogger(__name__)
router = APIRouter()

def get_data_manager(request: Request) -> RealTimeDataManager:
    """FastAPI dependency to retrieve the initialized RealTimeDataManager instance."""
    if not hasattr(request.app.state, 'data_manager'):
        raise HTTPException(status_code=503, detail="Data service is not currently available.")
    return request.app.state.data_manager

@router.get("/fires", response_model=Dict[str, Any], summary="Get Latest Fire Data")
async def get_fire_data(dm: RealTimeDataManager = Depends(get_data_manager)):
    """Retrieves the most recent cached wildfire data from sources like NASA FIRMS."""
    try:
        fire_data = await dm.get_latest_fire_data()
        if not fire_data:
            # You could optionally trigger a collection here, but it's better to let the background task handle it
            raise HTTPException(status_code=404, detail="Fire data not yet available. Please try again shortly.")
        return {
            'status': 'success',
            'data': fire_data,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting fire data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred while fetching fire data.")

@router.get("/weather", response_model=Dict[str, Any], summary="Get Latest Weather Data")
async def get_weather_data(dm: RealTimeDataManager = Depends(get_data_manager)):
    """Retrieves the most recent cached weather data from sources like NOAA."""
    try:
        weather_data = await dm.get_latest_weather_data()
        if not weather_data:
            raise HTTPException(status_code=404, detail="Weather data not yet available. Please try again shortly.")
        return {
            'status': 'success',
            'data': weather_data,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting weather data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred while fetching weather data.")

@router.get("/terrain", response_model=Dict[str, Any], summary="Get Terrain Data for a Location")
async def get_terrain_data(latitude: float, longitude: float, radius_km: float = 10, dm: RealTimeDataManager = Depends(get_data_manager)):
    """Retrieves terrain data (elevation, slope, fuel type) for a specific geographic area."""
    try:
        location_data = await dm.get_data_for_location(latitude, longitude, radius_km)
        return {
            'status': 'success',
            'data': location_data.get('terrain', {}),
            'location': location_data.get('location', {}),
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting terrain data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred while fetching terrain data.")

@router.get("/location/{latitude}/{longitude}", response_model=Dict[str, Any], summary="Get All Data for a Location")
async def get_location_data(latitude: float, longitude: float, radius_km: float = 50, dm: RealTimeDataManager = Depends(get_data_manager)):
    """Aggregates all available data (fires, weather, terrain) for a specific geographic point and radius."""
    try:
        location_data = await dm.get_data_for_location(latitude, longitude, radius_km)
        return {
            'status': 'success',
            'data': location_data,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting location data: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An internal server error occurred while fetching location data.")

@router.post("/refresh", response_model=Dict[str, Any], summary="Force Data Refresh")
async def refresh_data(dm: RealTimeDataManager = Depends(get_data_manager)):
    """Triggers an immediate, asynchronous refresh of all data sources."""
    try:
        logger.info("Forcing data refresh via API endpoint...")
        collected_data = await dm.collect_all_data()
        return {
            'status': 'success',
            'message': 'Data refresh completed successfully.',
            'data_points': {
                'fire': len(collected_data.get('fire', {}).get('active_fires', [])),
                'weather': len(collected_data.get('weather', {}).get('stations', [])),
                'terrain': 'cached' if 'terrain' in collected_data else 'none'
            },
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error during forced data refresh: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred during the data refresh process.")