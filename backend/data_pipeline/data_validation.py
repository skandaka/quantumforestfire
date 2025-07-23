"""
Data Validation for Fire Prediction System
Location: backend/data_pipeline/data_validation.py
"""

import logging
from typing import Dict, List, Any, Callable
from datetime import datetime
import numpy as np

logger = logging.getLogger(__name__)


class DataValidator:
    """Validates collected data for quality and completeness"""

    def __init__(self):
        self.validation_rules: Dict[str, Callable[[Dict[str, Any]], Dict[str, List[str]]]] = {
            'fire': self._validate_fire_data,
            'weather': self._validate_weather_data,
            'terrain': self._validate_terrain_data
        }

    async def validate_collection(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a complete data collection"""
        errors = []
        warnings = []

        for data_type, validator in self.validation_rules.items():
            if data_type in data:
                result = validator(data[data_type])
                errors.extend(result['errors'])
                warnings.extend(result['warnings'])

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'warnings': warnings,
            'timestamp': datetime.now().isoformat()
        }

    def _validate_fire_data(self, fire_data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Validate fire data"""
        errors = []
        warnings = []

        if 'active_fires' not in fire_data:
            errors.append("Missing active_fires data")
        else:
            fires = fire_data['active_fires']
            if not isinstance(fires, list):
                errors.append("active_fires must be a list")
            else:
                for i, fire in enumerate(fires):
                    if 'latitude' not in fire or 'longitude' not in fire:
                        errors.append(f"Fire {i} missing location data")
                    if 'confidence' in fire and (fire['confidence'] < 0 or fire['confidence'] > 1):
                        warnings.append(f"Fire {i} has invalid confidence value")

        return {'errors': errors, 'warnings': warnings}

    def _validate_weather_data(self, weather_data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Validate weather data"""
        errors = []
        warnings = []

        if 'stations' not in weather_data:
            warnings.append("No weather station data available")

        if 'current_conditions' in weather_data:
            conditions = weather_data['current_conditions']
            if 'avg_wind_speed' in conditions and conditions['avg_wind_speed'] > 100:
                warnings.append("Unusually high wind speed detected")
            if 'avg_humidity' in conditions and conditions['avg_humidity'] < 10:
                warnings.append("Extremely low humidity detected - high fire risk")

        return {'errors': errors, 'warnings': warnings}

    def _validate_terrain_data(self, terrain_data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Validate terrain data"""
        errors = []
        warnings = []

        if 'elevation' in terrain_data:
            if isinstance(terrain_data['elevation'], np.ndarray):
                if np.any(terrain_data['elevation'] < -500):
                    errors.append("Invalid elevation values detected")
            else:
                warnings.append("Elevation data is not in expected format")

        return {'errors': errors, 'warnings': warnings}