"""
Mock Fire Spread Model for Development and Demo
Provides realistic demo data while complex quantum models are being developed
"""

import numpy as np
from typing import Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class MockFireSpread:
    """Mock fire spread model that generates realistic demo data"""
    
    def __init__(self, grid_size: int = 20):
        self.grid_size = grid_size
        logger.info(f"🔥 Initialized MockFireSpread with {grid_size}x{grid_size} grid")
        
    async def predict(self, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Generate realistic fire spread prediction data"""
        
        # Create a realistic fire probability map
        fire_probability_map = self._generate_realistic_fire_map()
        
        # Generate high risk cells
        high_risk_cells = []
        total_area_at_risk = 0
        
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if fire_probability_map[i][j] > 0.7:
                    high_risk_cells.append([i, j])
                if fire_probability_map[i][j] > 0.3:
                    total_area_at_risk += 1
        
        # Calculate total area in hectares (assuming each cell is 1km²)
        total_area_hectares = total_area_at_risk * 100  # 1km² = 100 hectares
        
        return {
            "prediction_id": f"mock_pred_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "predictions": [{
                "time_step": 0,
                "timestamp": datetime.now().isoformat(),
                "fire_probability_map": fire_probability_map,
                "high_risk_cells": high_risk_cells,
                "total_area_at_risk": float(total_area_hectares)
            }],
            "metadata": {
                "model_type": "mock_fire_spread",
                "execution_time": 0.25,
                "quantum_backend": "mock_simulator",
                "accuracy_estimate": 0.92
            },
            "quantum_metrics": {
                "synthesis": {
                    "depth": 45,
                    "gate_count": 180,
                    "qubit_count": self.grid_size ** 2,
                    "synthesis_time": 0.15
                },
                "execution": {
                    "total_time": 0.25,
                    "backend": "mock_simulator"
                }
            },
            "warnings": []
        }
    
    def _generate_realistic_fire_map(self) -> list:
        """Generate a realistic fire probability map with hotspots and gradients"""
        # Start with base probabilities
        fire_map = np.random.exponential(0.1, (self.grid_size, self.grid_size))
        
        # Add fire hotspots (high probability areas)
        num_hotspots = np.random.randint(2, 5)
        for _ in range(num_hotspots):
            center_i = np.random.randint(3, self.grid_size - 3)
            center_j = np.random.randint(3, self.grid_size - 3)
            intensity = np.random.uniform(0.7, 0.95)
            
            # Create a gradient around the hotspot
            for i in range(max(0, center_i - 3), min(self.grid_size, center_i + 4)):
                for j in range(max(0, center_j - 3), min(self.grid_size, center_j + 4)):
                    distance = np.sqrt((i - center_i)**2 + (j - center_j)**2)
                    if distance <= 3:
                        gradient_intensity = intensity * np.exp(-distance / 2)
                        fire_map[i, j] = max(fire_map[i, j], gradient_intensity)
        
        # Add wind effect (fires spread more in wind direction)
        wind_direction = np.random.uniform(0, 2 * np.pi)
        wind_speed = np.random.uniform(5, 20)  # km/h
        
        for i in range(1, self.grid_size - 1):
            for j in range(1, self.grid_size - 1):
                # Increase probability in wind direction
                wind_effect = 0.1 * wind_speed / 20 * np.cos(wind_direction)
                fire_map[i, j] = min(1.0, fire_map[i, j] + abs(wind_effect))
        
        # Apply terrain effect (fires spread faster uphill)
        terrain_gradient = np.random.uniform(-0.1, 0.1, (self.grid_size, self.grid_size))
        fire_map = fire_map + terrain_gradient
        
        # Clip to valid probability range
        fire_map = np.clip(fire_map, 0.0, 1.0)
        
        return fire_map.tolist()
