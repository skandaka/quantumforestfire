# backend/setup_qiskit.sh
#!/bin/bash

echo "🔧 Setting up Qiskit properly..."
echo "================================"

# Activate virtual environment if it exists
if [ -d "../venv" ]; then
    source ../venv/bin/activate
elif [ -d "venv" ]; then
    source venv/bin/activate
fi

# Step 1: Completely remove all Qiskit packages
echo "Step 1: Removing all existing Qiskit packages..."
pip uninstall -y qiskit qiskit-aer qiskit-terra qiskit-ignis qiskit-aqua qiskit-ibm-provider qiskit-ibm-runtime qiskit-ibmq-provider

# Step 2: Clear pip cache
echo "Step 2: Clearing pip cache..."
pip cache purge

# Step 3: Install Qiskit packages in correct order
echo "Step 3: Installing Qiskit packages..."
pip install qiskit==1.0.2
pip install qiskit-aer==0.14.0.1
pip install qiskit-ibm-runtime==0.20.0

# Step 4: Verify installation
echo "Step 4: Verifying installation..."
python -c "
import qiskit
print(f'✅ Qiskit version: {qiskit.__version__}')
from qiskit_aer import AerSimulator
print('✅ Qiskit Aer imported successfully')
from qiskit_ibm_runtime import QiskitRuntimeService
print('✅ IBM Runtime imported successfully')
"

echo "✅ Qiskit setup complete!"