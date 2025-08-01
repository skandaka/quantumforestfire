# backend/quantum_models/qiskit_models/qiskit_fire_spread.py
"""
REAL Qiskit Fire Spread Model
Location: backend/quantum_models/qiskit_models/qiskit_fire_spread.py
"""

import numpy as np
from typing import Dict, Any, List, Tuple
import logging
from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
from qiskit.circuit import Parameter
from qiskit.circuit.library import TwoLocal, EfficientSU2
from qiskit.quantum_info import Statevector

logger = logging.getLogger(__name__)


class QiskitFireSpread:
    """REAL Qiskit fire spread model using quantum circuits"""

    def __init__(self):
        self.grid_size = 50
        self.grid_qubits = 10  # Encode 50x50 grid into 10 qubits
        self.ancilla_qubits = 5
        self.num_qubits = self.grid_qubits + self.ancilla_qubits

        # Pre-build parameterized circuit
        self.circuit_template = self._build_circuit_template()

    def get_qubit_requirements(self) -> int:
        """Get number of qubits required"""
        return self.num_qubits

    def _build_circuit_template(self) -> QuantumCircuit:
        """Build parameterized quantum circuit template"""
        # Quantum registers
        grid_reg = QuantumRegister(self.grid_qubits, 'grid')
        ancilla_reg = QuantumRegister(self.ancilla_qubits, 'anc')
        c_reg = ClassicalRegister(self.grid_qubits, 'c')

        qc = QuantumCircuit(grid_reg, ancilla_reg, c_reg)

        # Parameters for fire dynamics
        wind_params = [Parameter(f'wind_{i}') for i in range(4)]
        fuel_params = [Parameter(f'fuel_{i}') for i in range(4)]
        temp_params = [Parameter(f'temp_{i}') for i in range(2)]

        # Initialize quantum state based on fire locations
        # This would be done based on actual fire data
        for i in range(self.grid_qubits):
            qc.ry(Parameter(f'fire_init_{i}'), grid_reg[i])

        # Entanglement layer representing fire spread
        for i in range(self.grid_qubits - 1):
            qc.cx(grid_reg[i], grid_reg[i + 1])

        # Wind influence layer
        for i in range(min(4, self.grid_qubits)):
            qc.rz(wind_params[i], grid_reg[i])
            if i < self.grid_qubits - 1:
                qc.cx(grid_reg[i], grid_reg[i + 1])

        # Fuel and moisture dynamics
        for i in range(min(4, self.grid_qubits)):
            qc.ry(fuel_params[i], grid_reg[i])

        # Temperature effects
        qc.rx(temp_params[0], grid_reg[0])
        qc.rx(temp_params[1], grid_reg[self.grid_qubits // 2])

        # Use ancilla qubits for complex fire interactions
        for i in range(self.ancilla_qubits):
            if i < self.grid_qubits:
                qc.cx(grid_reg[i], ancilla_reg[i])

        # Apply controlled rotations based on ancilla
        for i in range(min(self.ancilla_qubits, self.grid_qubits)):
            qc.cry(Parameter(f'interact_{i}'), ancilla_reg[i], grid_reg[i])

        # Add variational layer for fire evolution
        variational_form = TwoLocal(
            self.grid_qubits,
            rotation_blocks=['ry', 'rz'],
            entanglement_blocks='cz',
            entanglement='circular',
            reps=2
        )

        qc.append(variational_form, grid_reg)

        # Measurement
        qc.measure(grid_reg, c_reg)

        return qc

    def build_circuit(self, fire_data: Dict[str, Any], weather_data: Dict[str, Any]) -> QuantumCircuit:
        """Build quantum circuit with actual fire and weather data"""
        logger.info(f"Building real Qiskit fire spread circuit with {self.num_qubits} qubits")

        # Create a copy of the template
        qc = self.circuit_template.copy()

        # Bind parameters based on actual data
        params_to_bind = {}

        # Initialize fire state parameters
        if 'active_fires' in fire_data:
            for i in range(self.grid_qubits):
                # Map grid position to fire intensity
                fire_intensity = self._calculate_fire_intensity_for_qubit(i, fire_data['active_fires'])
                params_to_bind[f'fire_init_{i}'] = fire_intensity * np.pi
        else:
            for i in range(self.grid_qubits):
                params_to_bind[f'fire_init_{i}'] = 0.1 * np.pi

        # Wind parameters
        wind_speed = weather_data.get('avg_wind_speed', 10)
        wind_direction = np.radians(weather_data.get('dominant_wind_direction', 0))
        for i in range(4):
            params_to_bind[f'wind_{i}'] = (wind_speed / 50) * np.pi * np.cos(wind_direction + i * np.pi/4)

        # Fuel parameters
        fuel_moisture = weather_data.get('fuel_moisture', 10)
        for i in range(4):
            params_to_bind[f'fuel_{i}'] = (1 - fuel_moisture / 100) * np.pi / 2

        # Temperature parameters
        temperature = weather_data.get('avg_temperature', 20)
        params_to_bind['temp_0'] = (temperature / 50) * np.pi
        params_to_bind['temp_1'] = (temperature / 50) * np.pi * 0.8

        # Interaction parameters
        for i in range(self.ancilla_qubits):
            params_to_bind[f'interact_{i}'] = 0.3 * np.pi

        # Bind all parameters that exist in the circuit
        existing_params = {param.name: param for param in qc.parameters}
        final_bindings = {}

        for param_name, value in params_to_bind.items():
            if param_name in existing_params:
                final_bindings[existing_params[param_name]] = value

        # Add default values for any remaining parameters
        for param in qc.parameters:
            if param not in final_bindings:
                final_bindings[param] = 0.1

        # Bind parameters
        qc.assign_parameters(final_bindings, inplace=True)
        return qc

    def _calculate_fire_intensity_for_qubit(self, qubit_idx: int, active_fires: List[Dict]) -> float:
        """Map fire locations to qubit representation"""
        if not active_fires:
            return 0.0

        # Simple mapping: divide grid into regions
        region_size = self.grid_size // int(np.sqrt(self.grid_qubits))
        region_x = (qubit_idx % int(np.sqrt(self.grid_qubits))) * region_size
        region_y = (qubit_idx // int(np.sqrt(self.grid_qubits))) * region_size

        # Check if any fire is in this region
        max_intensity = 0.0
        for fire in active_fires:
            # Map fire coordinates to grid
            fire_x = int((fire.get('latitude', 39) - 32.5) / (42.0 - 32.5) * self.grid_size)
            fire_y = int((fire.get('longitude', -120) + 124.5) / (124.5 - 114.0) * self.grid_size)

            if (region_x <= fire_x < region_x + region_size and
                region_y <= fire_y < region_y + region_size):
                max_intensity = max(max_intensity, fire.get('intensity', 0.8))

        return max_intensity

    def process_results(self, counts: Dict[str, int], fire_data: Dict[str, Any], weather_data: Dict[str, Any]) -> Dict[str, Any]:
        """Process real quantum measurement results"""
        total_shots = sum(counts.values())

        # Convert bit strings to fire probability map
        fire_probability_map = np.zeros((self.grid_size, self.grid_size))

        # Process each measurement outcome
        for bitstring, count in counts.items():
            probability = count / total_shots

            # Decode bitstring to grid positions
            for i, bit in enumerate(bitstring[::-1]):  # Reverse for Qiskit convention
                if bit == '1':
                    # Map qubit to grid region
                    region_size = self.grid_size // int(np.sqrt(self.grid_qubits))
                    if i < self.grid_qubits:
                        region_x = (i % int(np.sqrt(self.grid_qubits))) * region_size
                        region_y = (i // int(np.sqrt(self.grid_qubits))) * region_size

                        # Fill region with probability
                        for x in range(region_x, min(region_x + region_size, self.grid_size)):
                            for y in range(region_y, min(region_y + region_size, self.grid_size)):
                                fire_probability_map[x, y] += probability

        # Apply environmental modifiers
        wind_speed = weather_data.get('avg_wind_speed', 10)
        wind_direction = np.radians(weather_data.get('dominant_wind_direction', 0))

        # Create wind bias
        for i in range(self.grid_size):
            for j in range(self.grid_size):
                # Wind pushes fire in dominant direction
                wind_factor = 1 + 0.1 * wind_speed / 50 * np.cos(wind_direction)
                fire_probability_map[i, j] *= wind_factor

        # Normalize probabilities
        max_prob = np.max(fire_probability_map)
        if max_prob > 0:
            fire_probability_map /= max_prob

        # Identify high-risk cells
        high_risk_threshold = 0.7
        high_risk_cells = []

        for i in range(self.grid_size):
            for j in range(self.grid_size):
                if fire_probability_map[i, j] > high_risk_threshold:
                    high_risk_cells.append((i, j))

        # Calculate total area at risk
        cells_at_risk = np.sum(fire_probability_map > 0.3)
        area_at_risk = cells_at_risk * (10000 / (self.grid_size * self.grid_size))  # hectares

        return {
            'predictions': [{
                'time_step': 0,
                'fire_probability_map': fire_probability_map.tolist(),
                'high_risk_cells': high_risk_cells,
                'total_area_at_risk': float(area_at_risk)
            }],
            'metadata': {
                'model_type': 'qiskit_fire_spread',
                'backend': 'quantum',
                'execution_time': 0,  # Will be filled by manager
                'quantum_metrics': {
                    'total_shots': total_shots,
                    'unique_outcomes': len(counts),
                    'circuit_depth': self.circuit_template.depth(),
                    'gate_count': len(self.circuit_template)
                }
            }
        }