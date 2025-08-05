# API Data Contract

## Prediction API Response Structure

The `/api/predict` endpoint must return a JSON response with the following exact structure:

```json
{
  "prediction_id": "string",
  "status": "completed",
  "timestamp": "ISO 8601 string",
  "location": {
    "latitude": "number",
    "longitude": "number", 
    "radius_km": "number"
  },
  "predictions": [
    {
      "time_step": "number",
      "timestamp": "ISO 8601 string",
      "fire_probability_map": "2D array of numbers",
      "high_risk_cells": "array of [x, y] coordinates",
      "total_area_at_risk": "number",
      "ember_landing_map": "2D array of numbers (optional)",
      "ignition_risk_map": "2D array of numbers (optional)"
    }
  ],
  "heatmap_data": {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": {
          "type": "Point",
          "coordinates": ["longitude", "latitude"]
        },
        "properties": {
          "mag": "number (0.0 to 1.0, fire probability/intensity)",
          "time_step": "number",
          "risk_level": "string (low|medium|high|extreme)"
        }
      }
    ]
  },
  "metadata": {
    "model_type": "string",
    "execution_time": "number",
    "quantum_backend": "string",
    "accuracy_estimate": "number"
  },
  "quantum_metrics": {
    "synthesis": {
      "depth": "number",
      "gate_count": "number", 
      "qubit_count": "number",
      "synthesis_time": "number"
    },
    "execution": {
      "total_time": "number",
      "backend": "string"
    }
  },
  "warnings": ["array of warning strings"]
}
```

## Critical Requirements

1. **heatmap_data**: Must be a valid GeoJSON FeatureCollection
2. **features**: Each feature must be a Point with longitude/latitude coordinates
3. **mag property**: Must be a number between 0.0 and 1.0 representing fire probability/intensity
4. **Performance**: Filter out points with mag < 0.05 to reduce data size
5. **Geographic bounds**: For California simulations, use bounds: lat 32.5-42.0, lon -124.4--114.1

This contract is non-negotiable and must be followed exactly for the frontend heatmap to function.
