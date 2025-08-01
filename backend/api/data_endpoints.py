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
            # Return empty data structure instead of raising HTTPException
            return {
                'status': 'no_data',
                'data': {
                    'active_fires': [],
                    'metadata': {
                        'source': 'NASA FIRMS',
                        'message': 'Fire data not yet available. Please try again shortly.'
                    }
                },
                'timestamp': datetime.utcnow().isoformat()
            }
        return {
            'status': 'success',
            'data': fire_data,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting fire data: {e}", exc_info=True)
        # Return error in response body instead of raising
        return {
            'status': 'error',
            'data': {
                'active_fires': [],
                'metadata': {
                    'error': str(e)
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        }

@router.get("/weather", response_model=Dict[str, Any], summary="Get Latest Weather Data")
async def get_weather_data(dm: RealTimeDataManager = Depends(get_data_manager)):
    """Retrieves the most recent cached weather data from sources like NOAA."""
    try:
        weather_data = await dm.get_latest_weather_data()
        if not weather_data:
            # Return empty data structure instead of raising HTTPException
            return {
                'status': 'no_data',
                'data': {
                    'stations': [],
                    'current_conditions': {
                        'avg_temperature': 20,
                        'avg_humidity': 50,
                        'avg_wind_speed': 10,
                        'max_wind_speed': 15,
                        'dominant_wind_direction': 0
                    },
                    'metadata': {
                        'source': 'NOAA',
                        'message': 'Weather data not yet available. Please try again shortly.'
                    }
                },
                'timestamp': datetime.utcnow().isoformat()
            }
        return {
            'status': 'success',
            'data': weather_data,
            'timestamp': datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting weather data: {e}", exc_info=True)
        # Return error in response body instead of raising
        return {
            'status': 'error',
            'data': {
                'stations': [],
                'current_conditions': {
                    'avg_temperature': 20,
                    'avg_humidity': 50,
                    'avg_wind_speed': 10,
                    'max_wind_speed': 15,
                    'dominant_wind_direction': 0
                },
                'metadata': {
                    'error': str(e)
                }
            },
            'timestamp': datetime.utcnow().isoformat()
        }

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
        return {
            'status': 'error',
            'data': {},
            'location': {'latitude': latitude, 'longitude': longitude},
            'timestamp': datetime.utcnow().isoformat()
        }

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
        return {
            'status': 'error',
            'data': {},
            'timestamp': datetime.utcnow().isoformat()
        }

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
        return {
            'status': 'error',
            'message': 'Data refresh failed',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }