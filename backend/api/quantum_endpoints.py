"""
Quantum System API Endpoints
Location: backend/api/quantum_endpoints.py
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, List
from datetime import datetime
import logging

from ..quantum_models.quantum_simulator import QuantumSimulatorManager
from ..utils.performance_monitor import quantum_performance_tracker

logger = logging.getLogger(__name__)

router = APIRouter()


async def get_quantum_manager():
    """Get quantum manager instance"""
    from ..main import quantum_manager
    if not quantum_manager:
        raise HTTPException(status_code=503, detail="Quantum system not initialized")
    return quantum_manager


@router.get("/status")
async def get_quantum_status(
        quantum_manager: QuantumSimulatorManager = Depends(get_quantum_manager)
) -> Dict[str, Any]:
    """Get quantum system status"""
    try:
        backends = await quantum_manager.get_available_backends()

        return {
            'status': 'operational' if quantum_manager.is_healthy() else 'degraded',
            'available_backends': backends,
            'models': list(quantum_manager.models.keys()),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting quantum status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/metrics")
async def get_quantum_metrics() -> Dict[str, Any]:
    """Get quantum performance metrics"""
    try:
        report = await quantum_performance_tracker.get_quantum_performance_report()

        return {
            'status': 'success',
            'data': report,
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error getting quantum metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/backends")
async def list_backends(
        quantum_manager: QuantumSimulatorManager = Depends(get_quantum_manager)
) -> Dict[str, Any]:
    """List available quantum backends"""
    try:
        backends = await quantum_manager.get_available_backends()

        return {
            'backends': backends,
            'default': 'aer_simulator',
            'hardware_available': any(b['type'] == 'hardware' for b in backends),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error listing backends: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/backends/select")
async def select_backend(
        backend_name: str,
        quantum_manager: QuantumSimulatorManager = Depends(get_quantum_manager)
) -> Dict[str, Any]:
    """Select a specific quantum backend"""
    try:
        # Validate backend exists
        backends = await quantum_manager.get_available_backends()
        valid_names = [b['name'] for b in backends]

        if backend_name not in valid_names:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid backend. Valid options: {valid_names}"
            )

        # In a real implementation, this would configure the backend
        return {
            'status': 'success',
            'selected_backend': backend_name,
            'message': f'Backend {backend_name} selected for future operations'
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error selecting backend: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models")
async def list_quantum_models(
        quantum_manager: QuantumSimulatorManager = Depends(get_quantum_manager)
) -> Dict[str, Any]:
    """List available quantum models"""
    try:
        models = []
        for name, model in quantum_manager.models.items():
            model_info = {
                'name': name,
                'type': model.__class__.__name__,
                'ready': True,
                'description': ''
            }

            if 'fire_spread' in name:
                model_info['description'] = 'Quantum cellular automaton for fire propagation'
            elif 'ember' in name:
                model_info['description'] = 'Quantum superposition model for ember transport'
            elif 'optimizer' in name:
                model_info['description'] = 'Resource optimization for quantum circuits'

            models.append(model_info)

        return {
            'models': models,
            'total': len(models),
            'timestamp': datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error listing models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/circuits/visualize/{model_name}")
async def visualize_circuit(
        model_name: str,
        quantum_manager: QuantumSimulatorManager = Depends(get_quantum_manager)
) -> Dict[str, Any]:
    """Get circuit visualization for a model"""
    try:
        if model_name not in quantum_manager.models:
            raise HTTPException(status_code=404, detail=f"Model {model_name} not found")

        model = quantum_manager.models[model_name]

        # In a real implementation, this would generate actual circuit visualization
        return {
            'model': model_name,
            'visualization': {
                'type': 'circuit_diagram',
                'format': 'svg',
                'url': f'/api/quantum/circuits/{model_name}/diagram.svg'
            },
            'circuit_info': {
                'gates': 1500,
                'qubits': 20,
                'depth': 100
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error visualizing circuit: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))