# backend/initialize_quantum.py
# !/usr/bin/env python3
"""
Initialize and test REAL quantum components
"""
import asyncio
import logging
from quantum_models.quantum_simulator import QuantumSimulatorManager
from config import settings  # <-- This import is correct here
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def test_quantum_system():
    """Test the real quantum system"""
    logger.info("🚀 Testing REAL Quantum System...")

    # Initialize quantum manager
    quantum_manager = QuantumSimulatorManager()
    await quantum_manager.initialize()

    # Check available backends
    backends = await quantum_manager.get_available_backends()
    logger.info(f"\n✅ Available backends: {len(backends)}")
    for backend in backends:
        logger.info(f"  - {backend['name']}: {backend['type']} "
                    f"({backend['max_qubits']} qubits) - {backend['status']}")

    # Test a simple prediction
    logger.info("\n🔬 Running test prediction...")

    test_fire_data = {
        'active_fires': [{
            'latitude': 39.7596,
            'longitude': -121.6219,
            'intensity': 0.8,
            'area_hectares': 100
        }]
    }

    test_weather_data = {
        'avg_wind_speed': 25,
        'dominant_wind_direction': 45,
        'avg_temperature': 25,
        'avg_humidity': 30,
        'fuel_moisture': 8
    }

    result = await quantum_manager.run_prediction(
        test_fire_data,
        test_weather_data,
        model_type='qiskit_fire_spread',
        use_hardware=False
    )

    logger.info("✅ Prediction completed successfully!")
    logger.info(f"  - Model: {result['metadata']['model_type']}")
    logger.info(f"  - Backend: {result['metadata']['backend']}")

    await quantum_manager.shutdown()


if __name__ == "__main__":
    asyncio.run(test_quantum_system())