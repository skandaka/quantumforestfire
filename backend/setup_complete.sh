#!/bin/bash
# save as setup_complete.sh

echo "🔥 Complete Quantum Fire Prediction Setup"
echo "========================================"

# Activate virtual environment
source .venv/backend1/bin/activate

# Install all dependencies
cd backend
pip install --upgrade pip
pip install classiq
pip install -r requirements.txt

# Authenticate with Classiq
echo "Authenticating with Classiq..."
python authenticate_classiq.py

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Set up environment variables
if [ ! -f ".env" ]; then
    cp .env.template .env
    echo "⚠️  Please update .env with your API keys"
fi

cd ..

echo "✅ Setup complete!"