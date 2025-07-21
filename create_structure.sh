#!/bin/bash

# Create main project directory
mkdir -p quantum-fire-prediction
cd quantum-fire-prediction

# Create root files
touch README.md
touch .gitignore
touch .env.template
touch requirements.txt
touch package.json
touch docker-compose.yml

# Create backend directory structure
mkdir -p backend/{quantum_models/{classiq_models,qiskit_models},physics_models,data_pipeline,api,utils}

# Backend root files
touch backend/__init__.py
touch backend/main.py
touch backend/config.py

# Quantum models files
touch backend/quantum_models/__init__.py
touch backend/quantum_models/classiq_models/__init__.py
touch backend/quantum_models/classiq_models/classiq_fire_spread.py
touch backend/quantum_models/classiq_models/classiq_ember_dynamics.py
touch backend/quantum_models/classiq_models/classiq_optimization.py
touch backend/quantum_models/classiq_models/classiq_ml_algorithms.py
touch backend/quantum_models/classiq_models/classiq_circuit_synthesis.py
touch backend/quantum_models/qiskit_models/__init__.py
touch backend/quantum_models/qiskit_models/qiskit_fire_spread.py
touch backend/quantum_models/qiskit_models/qiskit_ember_transport.py
touch backend/quantum_models/qiskit_models/qiskit_noise_modeling.py
touch backend/quantum_models/circuit_builder.py
touch backend/quantum_models/quantum_simulator.py
touch backend/quantum_models/hardware_interface.py
touch backend/quantum_models/validation_algorithms.py

# Physics models files
touch backend/physics_models/__init__.py
touch backend/physics_models/fire_behavior.py
touch backend/physics_models/atmospheric_physics.py
touch backend/physics_models/thermodynamics.py
touch backend/physics_models/fluid_dynamics.py
touch backend/physics_models/vegetation_dynamics.py

# Data pipeline files
touch backend/data_pipeline/__init__.py
touch backend/data_pipeline/nasa_firms_collector.py
touch backend/data_pipeline/noaa_weather_collector.py
touch backend/data_pipeline/usgs_terrain_collector.py
touch backend/data_pipeline/data_processor.py
touch backend/data_pipeline/feature_engineering.py
touch backend/data_pipeline/real_time_feeds.py
touch backend/data_pipeline/data_validation.py

# API files
touch backend/api/__init__.py
touch backend/api/prediction_endpoints.py
touch backend/api/validation_endpoints.py
touch backend/api/data_endpoints.py
touch backend/api/quantum_endpoints.py
touch backend/api/classiq_endpoints.py

# Utils files
touch backend/utils/__init__.py
touch backend/utils/paradise_fire_demo.py
touch backend/utils/classiq_utils.py
touch backend/utils/performance_monitor.py

# Create frontend directory structure
mkdir -p frontend/{public/{models,textures,shaders},src/{app/{dashboard,demo/paradise-fire,classiq/{algorithms,circuits},api/{predictions,data,classiq}},components/{ui,layout,visualization,quantum,dashboard},hooks,lib,types},styles}

# Frontend config files
touch frontend/package.json
touch frontend/tsconfig.json
touch frontend/tailwind.config.js
touch frontend/next.config.js
touch frontend/postcss.config.js

# Frontend app files
touch frontend/src/app/layout.tsx
touch frontend/src/app/page.tsx
touch frontend/src/app/globals.css
touch frontend/src/app/dashboard/page.tsx
touch frontend/src/app/demo/paradise-fire/page.tsx
touch frontend/src/app/classiq/page.tsx
touch frontend/src/app/classiq/algorithms/page.tsx
touch frontend/src/app/classiq/circuits/page.tsx
touch frontend/src/app/api/predictions/route.ts
touch frontend/src/app/api/data/route.ts
touch frontend/src/app/api/classiq/route.ts

# Frontend component files
# UI components
touch frontend/src/components/ui/Button.tsx
touch frontend/src/components/ui/Input.tsx
touch frontend/src/components/ui/Select.tsx
touch frontend/src/components/ui/Slider.tsx
touch frontend/src/components/ui/Modal.tsx

# Layout components
touch frontend/src/components/layout/Header.tsx
touch frontend/src/components/layout/Sidebar.tsx
touch frontend/src/components/layout/Footer.tsx

# Visualization components
touch frontend/src/components/visualization/FireVisualization3D.tsx
touch frontend/src/components/visualization/QuantumFieldVisualization.tsx
touch frontend/src/components/visualization/EmberParticleSystem.tsx
touch frontend/src/components/visualization/TerrainRenderer.tsx

# Quantum components
touch frontend/src/components/quantum/QuantumControls.tsx
touch frontend/src/components/quantum/CircuitVisualizer.tsx
touch frontend/src/components/quantum/QuantumMetrics.tsx
touch frontend/src/components/quantum/ClassiqInterface.tsx
touch frontend/src/components/quantum/ClassiqCircuitBuilder.tsx

# Dashboard components
touch frontend/src/components/dashboard/PredictionDashboard.tsx
touch frontend/src/components/dashboard/ValidationDashboard.tsx
touch frontend/src/components/dashboard/ClassiqDashboard.tsx

# Hooks
touch frontend/src/hooks/useQuantumPrediction.ts
touch frontend/src/hooks/useRealTimeData.ts
touch frontend/src/hooks/use3DVisualization.ts
touch frontend/src/hooks/useClassiqIntegration.ts

# Lib files
touch frontend/src/lib/api.ts
touch frontend/src/lib/quantum-utils.ts
touch frontend/src/lib/three-utils.ts
touch frontend/src/lib/classiq-client.ts

# Types
touch frontend/src/types/quantum.ts
touch frontend/src/types/fire-prediction.ts
touch frontend/src/types/classiq.ts

# Styles
touch frontend/src/styles/components.css

# Create data directories
mkdir -p data/{historical_fires,demo_data,quantum_circuits,validation_results}

# Data files
touch data/historical_fires/paradise_fire_2018.json
touch data/historical_fires/camp_fire_2018.json
touch data/historical_fires/tubbs_fire_2017.json
touch data/historical_fires/thomas_fire_2017.json
touch data/demo_data/california_terrain.json
touch data/demo_data/sample_weather.json
touch data/demo_data/fuel_models.json
touch data/quantum_circuits/classiq_fire_spread.qmod
touch data/quantum_circuits/classiq_ember_dynamics.qmod
touch data/quantum_circuits/fire_spread_circuit.qasm
touch data/quantum_circuits/ember_dynamics_circuit.qasm
touch data/validation_results/quantum_vs_classical.json

# Create docs directory
mkdir -p docs
touch docs/HACKATHON_DEMO.md
touch docs/QUANTUM_ADVANTAGE.md
touch docs/CLASSIQ_INTEGRATION.md
touch docs/PARADISE_FIRE_ANALYSIS.md
touch docs/API_DOCUMENTATION.md
touch docs/DEPLOYMENT_GUIDE.md

# Create scripts directory
mkdir -p scripts
touch scripts/setup.sh
touch scripts/run_paradise_demo.py
touch scripts/validate_models.py
touch scripts/deploy.sh
touch scripts/generate_demo_data.py

# Create tests directory
mkdir -p tests
touch tests/test_quantum_models.py
touch tests/test_classiq_integration.py
touch tests/test_physics_models.py
touch tests/test_api_endpoints.py
touch tests/test_frontend_components.py

echo "✅ Project structure created successfully!"
echo "📁 Created quantum-fire-prediction/ with all directories and empty files"
