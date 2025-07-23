#!/bin/bash

echo "🔥 Quantum Fire Prediction System Setup"
echo "======================================"

# Check if Python 3.8+ is installed
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.8"

if [ "$(printf '%s\n' "$required_version" "$python_version" | sort -V | head -n1)" != "$required_version" ]; then 
    echo "❌ Python 3.8 or higher is required. Current version: $python_version"
    exit 1
fi

echo "✅ Python version: $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install backend dependencies
echo "Installing backend dependencies..."
cd backend
pip install -r requirements.txt
cd ..

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Create necessary directories
echo "Creating necessary directories..."
mkdir -p backend/data
mkdir -p backend/logs
mkdir -p backend/models
mkdir -p backend/data/quantum_circuits
mkdir -p backend/uploads

# Create .env file if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "Creating .env file..."
    cat > backend/.env << EOL
# Application Settings
DEBUG=True
ENVIRONMENT=development
HOST=0.0.0.0
PORT=8000

# API Keys (Add your actual keys here)
NASA_FIRMS_API_KEY=your_nasa_firms_key
NOAA_API_KEY=your_noaa_key
USGS_API_KEY=your_usgs_key
MAPBOX_API_KEY=your_mapbox_key

# Quantum Platform Credentials
IBM_QUANTUM_TOKEN=your_ibm_quantum_token
CLASSIQ_API_KEY=your_classiq_key

# Database
DATABASE_URL=postgresql://quantum:quantum@localhost:5432/quantum_fire

# Redis
REDIS_URL=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production
EOL
    echo "⚠️  Please update the .env file with your actual API keys"
fi

# Create frontend .env.local if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    echo "Creating frontend .env.local file..."
    cat > frontend/.env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token
EOL
    echo "⚠️  Please update the frontend/.env.local file with your Mapbox token"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update backend/.env with your API keys"
echo "2. Update frontend/.env.local with your Mapbox token"
echo "3. Start Redis: redis-server"
echo "4. Start the backend: cd backend && python -m main"
echo "5. Start the frontend: cd frontend && npm run dev"
echo ""
echo "The application will be available at:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:8000"
echo "- API Docs: http://localhost:8000/docs"
