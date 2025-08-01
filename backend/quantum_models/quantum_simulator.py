# backend/quantum_models/quantum_simulator.py
"""
Quantum Simulator Interface for Fire Prediction - REAL IMPLEMENTATION
Location: backend/quantum_models/quantum_simulator.py
"""

import asyncio
import logging
from typing import Dict, List, Any, Union, Optional
from datetime import datetime
from config import settings
import numpy as np
from concurrent.futures import ThreadPoolExecutor

# Real Qiskit imports
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister, transpile
from qiskit.providers import Backend, JobStatus
from qiskit_aer import AerSimulator
import os

# IBM Quantum imports
try:
    from qiskit_ibm_runtime import QiskitRuntimeService, Session, Sampler as RuntimeSampler
    IBM_RUNTIME_AVAILABLE = True
except ImportError:
    IBM_RUNTIME_AVAILABLE = False
    QiskitRuntimeService = None

# Import our quantum models
from quantum_models.classiq_models.classiq_fire_spread import ClassiqFireSpread, FireGridState
from quantum_models.classiq_models.classiq_ember_dynamics import ClassiqEmberDynamics, AtmosphericConditions
from quantum_models.qiskit_models.qiskit_fire_spread import QiskitFireSpread
from quantum_models.qiskit_models.qiskit_ember_transport import QiskitEmberTransport

from config import settings
from utils.performance_monitor import quantum_performance_tracker

logger = logging.getLogger(__name__)


class QuantumBackendManager:
    """Manages REAL quantum backend connections"""

    def __init__(self):
        self.aer_backends: Dict[str, AerSimulator] = {}
        self.ibm_service: Optional[QiskitRuntimeService] = None
        self.settings = settings
        self.available_backends: Dict[str, Any] = {}
        self.backend_status: Dict[str, Dict[str, Any]] = {}

    async def initialize(self):
        """Initialize REAL quantum backends"""
        logger.info("Initializing REAL Quantum Backend Manager...")

        # Initialize Aer simulators
        await self._initialize_aer_simulators()

        # Initialize IBM Quantum if credentials available
        if IBM_RUNTIME_AVAILABLE and settings.ibm_quantum_token:
            await self._initialize_ibm_quantum()

        # Update backend status
        await self._update_backend_status()

        logger.info(f"Backend Manager initialized with {len(self.available_backends)} real backends")

    async def _initialize_aer_simulators(self):
        """Initialize Qiskit Aer simulators"""
        try:
            # Create different Aer simulator configurations
            self.aer_backends = {
                'aer_simulator': AerSimulator(
                    method='automatic',
                    device='CPU',
                    precision='double',
                    max_parallel_threads=0,
                    max_parallel_experiments=0,
                    max_parallel_shots=0,
                    max_memory_mb=0,  # Use all available memory
                    fusion_enable=True,
                    fusion_verbose=False,
                    fusion_max_qubit=5,
                    fusion_threshold=14
                ),
                'aer_simulator_statevector': AerSimulator(
                    method='statevector',
                    device='CPU',
                    precision='double'
                ),
                'aer_simulator_density_matrix': AerSimulator(
                    method='density_matrix',
                    device='CPU',
                    precision='double'
                ),
                'aer_simulator_stabilizer': AerSimulator(
                    method='stabilizer',
                    device='CPU'
                ),
                'aer_simulator_matrix_product_state': AerSimulator(
                    method='matrix_product_state',
                    device='CPU',
                    matrix_product_state_truncation_threshold=1e-16
                )
            }

            # Add GPU simulator if available
            try:
                gpu_sim = AerSimulator(
                    method='automatic',
                    device='GPU',
                    precision='double'
                )
                if gpu_sim.available():
                    self.aer_backends['aer_simulator_gpu'] = gpu_sim
                    logger.info("GPU simulator available and initialized")
            except Exception as e:
                logger.info(f"GPU simulator not available: {e}")

            # Add all Aer backends to available backends
            for name, backend in self.aer_backends.items():
                self.available_backends[name] = backend

            logger.info(f"Initialized {len(self.aer_backends)} Aer simulator backends")

        except Exception as e:
            logger.error(f"Failed to initialize Aer simulators: {e}")
            raise

    async def _initialize_ibm_quantum(self):
        """Initialize IBM Quantum Runtime Service"""
        try:
            # Initialize the service
            self.service = QiskitRuntimeService(
                channel="ibm_quantum",
                token=settings.IBM_QUANTUM_TOKEN,  # <-- Use the imported 'settings'
                instance=settings.IBM_QUANTUM_CRN  # <-- Use the imported 'settings'
            )
            # Get available backends
            backends = self.ibm_service.backends()

            for backend in backends:
                backend_name = backend.name

                # Check if backend is operational and not a simulator
                config = backend.configuration()
                status = backend.status()

                if status.operational and not config.simulator:
                    self.available_backends[f"ibm_{backend_name}"] = backend
                    logger.info(f"Added IBM Quantum backend: {backend_name} "
                              f"({config.n_qubits} qubits, "
                              f"quantum_volume={config.quantum_volume if hasattr(config, 'quantum_volume') else 'N/A'})")

            logger.info(f"Connected to IBM Quantum with {len([b for b in backends if not b.configuration().simulator])} hardware backends")

        except Exception as e:
            logger.warning(f"Could not connect to IBM Quantum: {str(e)}")
            logger.info("IBM Quantum hardware will not be available")

    async def _update_backend_status(self):
        """Update status of all backends"""
        for name, backend in self.available_backends.items():
            try:
                if hasattr(backend, 'status'):
                    status = backend.status()

                    self.backend_status[name] = {
                        'operational': status.operational,
                        'pending_jobs': status.pending_jobs,
                        'status_msg': status.status_msg if hasattr(status, 'status_msg') else 'OK',
                        'backend_version': backend.version if hasattr(backend, 'version') else '1.0',
                        'last_update': datetime.now().isoformat()
                    }

                    # Add configuration details
                    if hasattr(backend, 'configuration'):
                        config = backend.configuration()
                        self.backend_status[name].update({
                            'n_qubits': config.n_qubits,
                            'simulator': config.simulator,
                            'local': config.local,
                            'coupling_map': config.coupling_map,
                            'basis_gates': config.basis_gates
                        })
                else:
                    # Aer simulator status
                    self.backend_status[name] = {
                        'operational': True,
                        'pending_jobs': 0,
                        'status_msg': 'Simulator ready',
                        'backend_version': backend.version if hasattr(backend, 'version') else '0.14.0',
                        'last_update': datetime.now().isoformat(),
                        'n_qubits': backend.configuration().n_qubits if hasattr(backend, 'configuration') else 30,
                        'simulator': True,
                        'local': True
                    }

            except Exception as e:
                logger.error(f"Error getting status for {name}: {str(e)}")
                self.backend_status[name] = {
                    'operational': False,
                    'error': str(e),
                    'last_update': datetime.now().isoformat()
                }

    async def select_optimal_backend(self, requirements: Dict[str, Any]) -> Backend:
        """Select optimal REAL backend based on requirements"""
        num_qubits = requirements.get('num_qubits', 10)
        use_hardware = requirements.get('use_hardware', False)
        preferred_backend = requirements.get('preferred_backend')

        # If specific backend requested
        if preferred_backend and preferred_backend in self.available_backends:
            return self.available_backends[preferred_backend]

        if not use_hardware:
            # Select best simulator based on circuit requirements
            if num_qubits <= 25 and requirements.get('need_statevector', False):
                return self.available_backends.get('aer_simulator_statevector',
                                                 self.available_backends['aer_simulator'])
            elif requirements.get('clifford_only', False):
                return self.available_backends.get('aer_simulator_stabilizer',
                                                 self.available_backends['aer_simulator'])
            elif num_qubits > 30:
                # Use MPS for large circuits
                return self.available_backends.get('aer_simulator_matrix_product_state',
                                                 self.available_backends['aer_simulator'])
            else:
                # Use GPU if available, otherwise CPU
                return self.available_backends.get('aer_simulator_gpu',
                                                 self.available_backends['aer_simulator'])

        # Select hardware backend
        suitable_backends = []
        for name, backend in self.available_backends.items():
            if 'ibm_' in name and name in self.backend_status:
                status = self.backend_status[name]
                if (status['operational'] and
                    status.get('n_qubits', 0) >= num_qubits):

                    suitable_backends.append({
                        'name': name,
                        'backend': backend,
                        'queue': status.get('pending_jobs', 0),
                        'qubits': status.get('n_qubits', 0),
                        'quantum_volume': status.get('quantum_volume', 0)
                    })

        if suitable_backends:
            # Sort by queue length and quantum volume
            suitable_backends.sort(key=lambda x: (x['queue'], -x.get('quantum_volume', 0)))
            return suitable_backends[0]['backend']
        else:
            logger.warning("No suitable hardware backend found, using best simulator")
            return self.available_backends['aer_simulator']

    def get_backend_info(self) -> Dict[str, Any]:
        """Get information about available backends"""
        simulators = []
        hardware = []

        for name, status in self.backend_status.items():
            backend_info = {
                'name': name,
                'operational': status.get('operational', False),
                'n_qubits': status.get('n_qubits', 'unknown'),
                'pending_jobs': status.get('pending_jobs', 0),
                'backend_version': status.get('backend_version', 'unknown')
            }

            if status.get('simulator', True):
                simulators.append(backend_info)
            else:
                hardware.append(backend_info)

        return {
            'simulators': simulators,
            'hardware_backends': hardware,
            'total_backends': len(self.available_backends)
        }


class QuantumSimulatorManager:
    """Manages all REAL quantum simulators and models"""

    def __init__(self):
        self.backend_manager = QuantumBackendManager()
        self.models: Dict[str, Any] = {}
        self.active_jobs: Dict[str, Any] = {}
        self.executor = ThreadPoolExecutor(max_workers=4)
        self._initialized = False

    async def initialize(self):
        """Initialize all quantum models and backends"""
        logger.info("Initializing Quantum Simulator Manager with REAL backends...")
        print(f"DEBUG: Attempting to load token: {os.getenv('IBM_QUANTUM_TOKEN')}")
        # Initialize backend manager
        await self.backend_manager.initialize()

        # Initialize quantum models
        try:
            # Classiq models
            self.models['classiq_fire_spread'] = ClassiqFireSpread(grid_size=50)
            self.models['classiq_ember_dynamics'] = ClassiqEmberDynamics(
                max_embers=1000,
                spatial_resolution=10.0
            )

            # Real Qiskit models
            self.models['qiskit_fire_spread'] = QiskitFireSpread()
            self.models['qiskit_ember_transport'] = QiskitEmberTransport()

            logger.info(f"Successfully initialized {len(self.models)} quantum models")

        except Exception as e:
            logger.error(f"Error initializing quantum models: {e}")
            # Continue with partial initialization

        self._initialized = True
        logger.info("Quantum Simulator Manager initialized successfully")

    def is_healthy(self) -> bool:
        """Check if quantum systems are healthy"""
        return self._initialized and len(self.backend_manager.available_backends) > 0

    async def get_available_backends(self) -> List[Dict[str, Any]]:
        """Get list of available REAL quantum backends"""
        backends = []

        for name, status in self.backend_manager.backend_status.items():
            backend = self.backend_manager.available_backends.get(name)
            if backend:
                backends.append({
                    'name': name,
                    'type': 'simulator' if status.get('simulator', True) else 'hardware',
                    'status': 'available' if status.get('operational', False) else 'offline',
                    'max_qubits': status.get('n_qubits', 30),
                    'queue_length': status.get('pending_jobs', 0),
                    'backend_version': status.get('backend_version', 'unknown'),
                    'basis_gates': status.get('basis_gates', []),
                    'coupling_map': 'full' if status.get('simulator', True) else 'restricted'
                })

        return backends

    async def run_prediction(
        self,
        fire_data: Dict,
        weather_data: Dict,
        model_type: str = 'classiq_fire_spread',
        use_hardware: bool = False
    ) -> Dict[str, Any]:
        """Run a REAL quantum prediction"""
        if not self._initialized:
            await self.initialize()

        model = self.models.get(model_type)
        if not model:
            raise ValueError(f"Model {model_type} not available")

        start_time = datetime.now()

        try:
            if 'classiq' in model_type:
                # Classiq models
                result = await self._run_classiq_model(model, fire_data, weather_data)
            else:
                # Qiskit models
                result = await self._run_qiskit_model(
                    model, fire_data, weather_data, use_hardware
                )

            execution_time = (datetime.now() - start_time).total_seconds()

            # Track performance
            await quantum_performance_tracker.track_prediction({
                'model_type': model_type,
                'use_hardware': use_hardware,
                'execution_time': execution_time,
                **result
            })

            return result

        except Exception as e:
            logger.error(f"Error running prediction with {model_type}: {e}")
            raise

    async def _run_qiskit_model(
        self,
        model: Any,
        fire_data: Dict,
        weather_data: Dict,
        use_hardware: bool
    ) -> Dict[str, Any]:
        """Run a REAL Qiskit quantum model"""

        # Build quantum circuit
        circuit = model.build_circuit(fire_data, weather_data)

        # Select backend
        backend = await self.backend_manager.select_optimal_backend({
            'num_qubits': model.get_qubit_requirements(),
            'use_hardware': use_hardware
        })

        logger.info(f"Running on backend: {backend.name if hasattr(backend, 'name') else 'aer_simulator'}")

        # Transpile circuit for backend
        transpiled = transpile(
            circuit,
            backend=backend,
            optimization_level=3,
            seed_transpiler=42
        )

        # Execute circuit
        if use_hardware and IBM_RUNTIME_AVAILABLE and 'ibm_' in str(backend):
            # Use Runtime for hardware execution
            with Session(service=self.backend_manager.ibm_service, backend=backend) as session:
                sampler = RuntimeSampler(session=session)
                job = sampler.run(transpiled, shots=4096)
                result = job.result()
        else:
            # Use local execution
            job = backend.run(transpiled, shots=4096)
            result = job.result()

        # Process results
        counts = result.get_counts() if hasattr(result, 'get_counts') else {}
        processed_results = model.process_results(counts, fire_data, weather_data)

        # Add backend info
        processed_results['metadata']['backend'] = backend.name if hasattr(backend, 'name') else 'aer_simulator'
        processed_results['metadata']['transpiled_depth'] = transpiled.depth()
        processed_results['metadata']['transpiled_gates'] = transpiled.count_ops()

        return processed_results

    async def _run_classiq_model(
        self,
        model: Any,
        fire_data: Dict,
        weather_data: Dict
    ) -> Dict[str, Any]:
        """Run a Classiq quantum model"""

        # Prepare fire state
        if hasattr(model, 'predict'):
            if isinstance(model, ClassiqFireSpread):
                # Prepare FireGridState
                fire_state = FireGridState(
                    size=model.grid_size,
                    cells=self._prepare_fire_grid(fire_data, model.grid_size),
                    wind_field=self._prepare_wind_field(weather_data, model.grid_size),
                    fuel_moisture=np.full((model.grid_size, model.grid_size),
                                        weather_data.get('fuel_moisture', 10)),
                    terrain_elevation=self._prepare_terrain(fire_data, model.grid_size),
                    temperature=np.full((model.grid_size, model.grid_size),
                                      weather_data.get('temperature', 293.15))
                )
                return await model.predict(fire_state)

            elif isinstance(model, ClassiqEmberDynamics):
                # Prepare atmospheric conditions
                conditions = AtmosphericConditions(
                    wind_field=self._prepare_3d_wind_field(weather_data),
                    temperature_field=np.full((50, 50), weather_data.get('temperature', 293.15)),
                    humidity_field=np.full((50, 50), weather_data.get('humidity', 50)),
                    turbulence_intensity=weather_data.get('turbulence', 0.5),
                    pressure_gradient=np.array([0.1, 0, 0]),
                    boundary_layer_height=1500
                )
                return await model.predict_ember_spread(
                    fire_source=fire_data,
                    atmospheric_conditions=conditions,
                    duration_minutes=30
                )

        raise ValueError(f"Unknown model type: {type(model)}")

    def _prepare_fire_grid(self, fire_data: Dict, grid_size: int) -> np.ndarray:
        """Prepare fire intensity grid from fire data"""
        grid = np.zeros((grid_size, grid_size))

        if 'active_fires' in fire_data:
            for fire in fire_data['active_fires']:
                # Map fire location to grid
                lat = fire.get('latitude', fire.get('center_lat', 0))
                lon = fire.get('longitude', fire.get('center_lon', 0))

                # Simple mapping (would use proper projection in production)
                i = int((lat - 32.5) / (42.0 - 32.5) * grid_size)
                j = int((lon + 124.5) / (124.5 - 114.0) * grid_size)

                if 0 <= i < grid_size and 0 <= j < grid_size:
                    grid[i, j] = fire.get('intensity', 0.8)

        return grid

    def _prepare_wind_field(self, weather_data: Dict, grid_size: int) -> np.ndarray:
        """Prepare wind field from weather data"""
        wind_speed = weather_data.get('avg_wind_speed', 10)
        wind_direction = weather_data.get('dominant_wind_direction', 0)

        # Convert to m/s
        wind_speed_ms = wind_speed * 0.44704

        # Create uniform wind field (simplified)
        return np.full((grid_size, grid_size), wind_speed_ms)

    def _prepare_terrain(self, fire_data: Dict, grid_size: int) -> np.ndarray:
        """Prepare terrain elevation grid"""
        # Use terrain data if available, otherwise create synthetic
        if 'terrain' in fire_data and 'elevation' in fire_data['terrain']:
            return fire_data['terrain']['elevation']

        # Create synthetic terrain
        x = np.linspace(0, 10, grid_size)
        y = np.linspace(0, 10, grid_size)
        X, Y = np.meshgrid(x, y)

        # Rolling hills
        terrain = 500 + 100 * np.sin(X/2) * np.cos(Y/2)
        return terrain

    def _prepare_3d_wind_field(self, weather_data: Dict) -> np.ndarray:
        """Prepare 3D wind field for ember dynamics"""
        # Create 10x10x10 wind field
        size = 10
        wind_field = np.zeros((size, size, 3))

        base_speed = weather_data.get('avg_wind_speed', 10) * 0.44704
        direction = np.radians(weather_data.get('dominant_wind_direction', 0))

        for i in range(size):
            for j in range(size):
                # Add height variation
                height_factor = 1 + i * 0.1

                wind_field[i, j, 0] = base_speed * np.cos(direction) * height_factor
                wind_field[i, j, 1] = base_speed * np.sin(direction) * height_factor
                wind_field[i, j, 2] = 0  # No vertical component for now

        return wind_field

    async def run_ensemble_prediction(
        self,
        fire_data: Dict,
        weather_data: Dict
    ) -> Dict[str, Any]:
        """Run ensemble prediction using multiple REAL models"""
        if not self._initialized:
            await self.initialize()

        results = []

        # Run available models in parallel
        tasks = []
        for model_name, model in self.models.items():
            if hasattr(model, 'predict') or hasattr(model, 'build_circuit'):
                task = self.run_prediction(
                    fire_data, weather_data,
                    model_type=model_name,
                    use_hardware=False
                )
                tasks.append((model_name, task))

        # Gather results
        for model_name, task in tasks:
            try:
                result = await task
                result['model'] = model_name
                results.append(result)
            except Exception as e:
                logger.error(f"Error running {model_name}: {e}")

        # Combine results
        if results:
            ensemble_result = {
                'predictions': self._combine_predictions(results),
                'models_used': [r['model'] for r in results],
                'metadata': {
                    'type': 'ensemble',
                    'models_count': len(results),
                    'timestamp': datetime.now().isoformat()
                }
            }
            return ensemble_result
        else:
            raise RuntimeError("No models produced valid results")

    def _combine_predictions(self, results: List[Dict]) -> List[Dict]:
        """Combine predictions from multiple models"""
        # Simple averaging for now
        if not results:
            return []

        # Use first model's structure
        combined = results[0].get('predictions', [])

        # Could implement more sophisticated ensemble methods:
        # - Weighted averaging based on model performance
        # - Voting for classification tasks
        # - Stacking with meta-learner

        return combined

    async def shutdown(self):
        """Shutdown quantum simulator manager"""
        logger.info("Shutting down Quantum Simulator Manager...")

        # Cancel any active jobs
        for job_id, job in self.active_jobs.items():
            try:
                if hasattr(job, 'cancel'):
                    job.cancel()
            except Exception as e:
                logger.error(f"Error cancelling job {job_id}: {e}")

        # Shutdown executor
        self.executor.shutdown(wait=False)

        self._initialized = False
        logger.info("Quantum Simulator Manager shut down")