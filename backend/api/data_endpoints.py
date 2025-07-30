"""
Data API Endpoints
Location: backend/api/data_endpoints.py
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from data_pipeline.real_time_feeds import RealTimeDataManager

logger = logging.getLogger(__name__)

router = APIRouter()

async def get_data_manager():
    """Get data manager instance"""
    import managers
    if not managers.data_manager:
        raise HTTPException(status_code=503, detail="Data system not initialized")
    return managers.data_manager


@router.get("/fires")
async def get_fire_data(
        data_manager: RealTimeDataManager = Depends(get_data_manager)
) -> Dict[str, Any]:
    """Get latest fire data"""
    try:
        fire_data = await data_manager.get_latest_fire_data()
        if not fire_data:
            # Trigger new collection if no cached data
            all_data = await data_manager.collect_all_data()
            fire_data = all_data.get('fire', {})

        return {
            'status': 'success',
            'data': fire_data,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting fire data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/weather")
async def get_weather_data(
        data_manager: RealTimeDataManager = Depends(get_data_manager)
) -> Dict[str, Any]:
    """Get latest weather data"""
    try:
        weather_data = await data_manager.get_latest_weather_data()
        if not weather_data:
            # Trigger new collection if no cached data
            all_data = await data_manager.collect_all_data()
            weather_data = all_data.get('weather', {})

        return {
            'status': 'success',
            'data': weather_data,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting weather data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/terrain")
async def get_terrain_data(
        latitude: float,
        longitude: float,
        radius_km: float = 50,
        data_manager: RealTimeDataManager = Depends(get_data_manager)
) -> Dict[str, Any]:
    """Get terrain data for location"""
    try:
        location_data = await data_manager.get_data_for_location(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km
        )

        return {
            'status': 'success',
            'data': location_data.get('terrain', {}),
            'location': {
                'latitude': latitude,
                'longitude': longitude,
                'radius_km': radius_km
            },
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting terrain data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/location/{latitude}/{longitude}")
async def get_location_data(
        latitude: float,
        longitude: float,
        radius_km: float = 50,
        data_manager: RealTimeDataManager = Depends(get_data_manager)
) -> Dict[str, Any]:
    """Get all data for a specific location"""
    try:
        location_data = await data_manager.get_data_for_location(
            latitude=latitude,
            longitude=longitude,
            radius_km=radius_km
        )

        return {
            'status': 'success',
            'data': location_data,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting location data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/refresh")
async def refresh_data(
        data_manager: RealTimeDataManager = Depends(get_data_manager)
) -> Dict[str, Any]:
    """Force refresh of all data sources"""
    try:
        logger.info("Forcing data refresh...")
        collected_data = await data_manager.collect_all_data()

        return {
            'status': 'success',
            'message': 'Data refresh completed',
            'data_points': {
                'fire': len(collected_data.get('fire', {}).get('active_fires', [])),
                'weather': len(collected_data.get('weather', {}).get('stations', [])),
                'terrain': 'cached' if 'terrain' in collected_data else 'none'
            },
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error refreshing data: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))