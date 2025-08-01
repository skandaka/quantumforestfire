#!/usr/bin/env python3
"""
Test Qiskit Setup
Location: backend/test_qiskit_setup.py
"""

import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def test_qiskit_imports():
    """Test if Qiskit imports are working correctly"""
    print("Testing Qiskit imports...")
    print("=" * 50)

    # Test core Qiskit
    try:
        from qiskit import QuantumCircuit
        print("✅ Qiskit core imported successfully")

        # Create a simple circuit to test
        qc = QuantumCircuit(2)
        qc.h(0)
        qc.cx(0, 1)
        print("✅ Created test quantum circuit")

    except ImportError as e:
        print(f"❌ Failed to import Qiskit core: {e}")
        return False

    # Test Qiskit Aer
    try:
        from qiskit_aer import AerSimulator
        print("✅ Qiskit Aer imported successfully")

        # Create simulator
        simulator = AerSimulator()
        print("✅ Created Aer simulator")

    except ImportError as e:
        print(f"❌ Failed to import Qiskit Aer: {e}")
        return False

    # Test IBM Provider (optional)
    try:
        from qiskit_ibm_provider import IBMProvider
        print("✅ IBM Quantum Provider imported successfully")
    except ImportError as e:
        print("⚠️  IBM Quantum Provider not available (optional): {e}")

    print("\nAll required Qiskit components are working!")
    return True


def test_quantum_simulator():
    """Test the quantum simulator module"""
    print("\nTesting Quantum Simulator module...")
    print("=" * 50)

    try:
        from quantum_models.quantum_simulator import (
            QISKIT_AVAILABLE,
            IBMQ_AVAILABLE,
            QuantumBackendManager
        )

        print(f"✅ Quantum simulator module imported")
        print(f"   - QISKIT_AVAILABLE: {QISKIT_AVAILABLE}")
        print(f"   - IBMQ_AVAILABLE: {IBMQ_AVAILABLE}")

        if QISKIT_AVAILABLE:
            print("✅ Qiskit is properly configured in the quantum simulator")
        else:
            print("❌ Qiskit is not properly configured in the quantum simulator")

    except Exception as e:
        print(f"❌ Failed to import quantum simulator: {e}")
        return False

    return True


if __name__ == "__main__":
    print("🔬 Quantum Fire Prediction - Qiskit Setup Test")
    print()

    # Test imports
    if test_qiskit_imports():
        test_quantum_simulator()
    else:
        print("\n❌ Please install required packages:")
        print("   pip install qiskit==1.0.2 qiskit-aer==0.14.0.1")
        sys.exit(1)