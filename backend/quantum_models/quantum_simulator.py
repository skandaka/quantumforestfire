import logging
from typing import Dict, Any, List

# --- Corrected Library Imports ---
from qiskit_ibm_runtime import QiskitRuntimeService
from qiskit_aer import AerSimulator

# --- Corrected Local Imports ---
from backend.config import Settings
from backend.quantum_models.classiq_models.classiq_fire_spread import ClassiqFireSpread
from backend.quantum_models.classiq_models.classiq_ember_dynamics import ClassiqEmberDynamics


class QuantumSimulatorManager:
    """
    Manages the lifecycle and execution of all quantum models.
    Delegates complex simulation tasks to specialized Classiq model classes.
    """

    def __init__(self, settings: Settings):
        self.settings = settings
        self.qiskit_runtime_service = None
        self.aer_simulator = AerSimulator()

        # Instantiate the complex, stateful model handlers
        self.models = {
            "classiq_fire_spread": ClassiqFireSpread(),
            "classiq_ember_dynamics": ClassiqEmberDynamics(),
        }
        self._initialize_hardware_backends()
        logging.info("QuantumSimulatorManager initialized with available models.")

    def _initialize_hardware_backends(self):
        """Initializes connection to IBM Quantum hardware backends if a token is provided."""
        ibm_token = self.settings.IBM_QUANTUM_TOKEN
        if ibm_token:
            try:
                self.qiskit_runtime_service = QiskitRuntimeService(channel="ibm_quantum", token=ibm_token)
                logging.info(
                    f"✅ Successfully connected to IBM Quantum Runtime Service. Available backends: {[b.name for b in self.qiskit_runtime_service.backends()]}")
            except Exception as e:
                logging.error(f"❌ Failed to initialize IBM Quantum Runtime Service: {e}")
                self.qiskit_runtime_service = None
        else:
            logging.warning("⚠️ IBM_QUANTUM_TOKEN not found. Only local simulators will be available for Qiskit.")

    def list_models(self) -> List[str]:
        """Returns a list of available high-level quantum models."""
        return list(self.models.keys())

    async def run_simulation(self, model_name: str, parameters: Dict[str, Any]) -> Dict[str, Any]:
        """
        Runs a full quantum simulation by delegating to the appropriate model handler.
        """
        if model_name not in self.models:
            raise ValueError(f"Model '{model_name}' not found.")

        logging.info(f"🚀 Initiating simulation for model: {model_name}")
        model_handler = self.models[model_name]

        try:
            # The model handler's `predict` method contains the full, complex logic
            # for building, synthesizing, and executing the quantum program.
            result = await model_handler.predict(parameters)
            logging.info(f"✅ Simulation for '{model_name}' completed successfully.")
            return result
        except Exception as e:
            logging.error(f"❌ Error during quantum simulation for '{model_name}': {e}", exc_info=True)
            raise