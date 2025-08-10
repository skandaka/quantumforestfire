"use client";

import React, { useState, useEffect } from 'react';

// Lightweight type definitions to satisfy TS without enforcing strict backend schema
interface TrendsSummary {
  total_events?: number;
  trend_direction?: string;
  [key: string]: any;
}
interface RiskPrediction {
  risk_level: string;
  probability: number;
  risk_score: number;
  time_window_hours: number;
  contributing_factors: string[];
  [key: string]: any;
}
interface FirePatternsSummary {
  total_clusters?: number;
  cluster_details?: Record<string, any>;
  [key: string]: any;
}
interface RiskMapSummary {
  grid_dimensions?: { rows: number; cols: number };
  max_risk?: number;
  avg_risk?: number;
  resolution?: number;
  bounds?: { min_lat: number; max_lat: number; min_lon: number; max_lon: number };
  generated_at?: string;
  [key: string]: any;
}
interface AnomalyRecord {
  description?: string;
  anomaly_score?: number;
  severity?: string;
  [key: string]: any;
}
import { motion } from 'framer-motion';

// Advanced Analytics Dashboard Component
export default function AdvancedAnalyticsDashboard() {
  const [trends, setTrends] = useState<TrendsSummary | null>(null);
  const [riskPredictions, setRiskPredictions] = useState<RiskPrediction[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyRecord[]>([]);
  const [firePatterns, setFirePatterns] = useState<FirePatternsSummary | null>(null);
  const [riskMap, setRiskMap] = useState<RiskMapSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Load historical trends
      const trendsResponse = await fetch('/api/v1/phase4/analytics/trends?time_window_days=30');
      const trendsData = await trendsResponse.json();
      setTrends(trendsData.data);

      // Load risk predictions
      const predictionsResponse = await fetch('/api/v1/phase4/analytics/risk-prediction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prediction_horizon_hours: 72,
          location: [37.0, -122.0]
        })
      });
      const predictionsData = await predictionsResponse.json();
      setRiskPredictions(predictionsData.predictions || []);

      // Load fire patterns
      const patternsResponse = await fetch('/api/v1/phase4/analytics/fire-patterns');
      const patternsData = await patternsResponse.json();
      setFirePatterns(patternsData.patterns);

      // Generate risk map
      const riskMapResponse = await fetch('/api/v1/phase4/analytics/risk-map', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grid_resolution: 0.05,
          bounds: {
            min_lat: 36.5, max_lat: 37.5,
            min_lon: -122.5, max_lon: -121.5
          }
        })
      });
      const riskMapData = await riskMapResponse.json();
      setRiskMap(riskMapData.risk_map);

    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalies = async () => {
    try {
      // Generate sample data for anomaly detection
      const sampleData = Array.from({ length: 50 }, () => ({
        latitude: 37.0 + (Math.random() - 0.5) * 0.5,
        longitude: -122.0 + (Math.random() - 0.5) * 0.5,
        temperature: 15 + Math.random() * 30,
        humidity: 30 + Math.random() * 40,
        wind_speed: Math.random() * 20,
        precipitation: Math.random() * 10,
        elevation: Math.random() * 1000,
        slope: Math.random() * 30,
        vegetation_density: Math.random(),
        fuel_moisture: 5 + Math.random() * 20,
        quantum_risk_score: Math.random(),
        classical_risk_score: Math.random(),
        ensemble_score: Math.random(),
        area_burned: Math.random() * 500
      }));

      const response = await fetch('/api/v1/phase4/analytics/anomaly-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sampleData)
      });
      
      const anomaliesData = await response.json();
      setAnomalies(anomaliesData.anomalies || []);
    } catch (error) {
      console.error('Error detecting anomalies:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading advanced analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Historical analysis, trend prediction, and risk assessment
          </p>
        </div>

        {/* Analytics Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Events</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trends?.total_events || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Trend Direction</p>
                <p className="text-2xl font-bold text-gray-900 capitalize">
                  {trends?.trend_direction || 'stable'}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Fire Clusters</p>
                <p className="text-2xl font-bold text-gray-900">
                  {firePatterns?.total_clusters || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-100 mr-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Anomalies</p>
                <p className="text-2xl font-bold text-gray-900">
                  {anomalies.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Risk Predictions */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Predictions</h3>
            <div className="space-y-4">
              {riskPredictions.map((prediction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    prediction.risk_level === 'extreme' ? 'border-red-500 bg-red-50' :
                    prediction.risk_level === 'high' ? 'border-orange-500 bg-orange-50' :
                    prediction.risk_level === 'moderate' ? 'border-yellow-500 bg-yellow-50' :
                    'border-green-500 bg-green-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 capitalize">
                        {prediction.risk_level} Risk
                      </p>
                      <p className="text-sm text-gray-600">
                        {prediction.time_window_hours}h forecast
                      </p>
                      <p className="text-sm text-gray-600">
                        Probability: {(prediction.probability * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">
                        {(prediction.risk_score * 100).toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500">Risk Score</p>
                    </div>
                  </div>
                  {prediction.contributing_factors.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 mb-1">Contributing Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {prediction.contributing_factors.map((factor, i) => (
                          <span key={i} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {factor}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Fire Pattern Clusters */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fire Pattern Analysis</h3>
            {firePatterns?.cluster_details && (
              <div className="space-y-4">
                {Object.entries(firePatterns.cluster_details).slice(0, 3).map(([clusterName, details]) => (
                  <div key={clusterName} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {clusterName.replace('_', ' ').toUpperCase()}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Size: {details.size} events</p>
                        <p className="text-gray-600">
                          Avg Area: {details.avg_area_burned?.toFixed(1)} acres
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">
                          Center: {details.geographic_center?.latitude?.toFixed(2)}, {details.geographic_center?.longitude?.toFixed(2)}
                        </p>
                        <p className="text-gray-600">
                          Avg Temp: {details.weather_characteristics?.avg_temperature?.toFixed(1)}°C
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Anomaly Detection */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Anomaly Detection</h3>
            <button
              onClick={detectAnomalies}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Run Detection
            </button>
          </div>
          
          {anomalies.length > 0 ? (
            <div className="space-y-3">
              {anomalies.map((anomaly, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-l-4 ${
                    anomaly.severity === 'high' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">{anomaly.description}</p>
                      <p className="text-sm text-gray-600">
                        Score: {anomaly.anomaly_score?.toFixed(3)} | Severity: {anomaly.severity}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      anomaly.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {anomaly.severity}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No anomalies detected. Click "Run Detection" to analyze data.
            </p>
          )}
        </div>

        {/* Risk Map Visualization */}
        {riskMap && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Map</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Map Statistics</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    Grid Size: {riskMap.grid_dimensions?.rows} × {riskMap.grid_dimensions?.cols}
                  </p>
                  <p className="text-gray-600">
                    Max Risk: {riskMap.max_risk !== undefined ? (riskMap.max_risk * 100).toFixed(1) : '—'}%
                  </p>
                  <p className="text-gray-600">
                    Avg Risk: {riskMap.avg_risk !== undefined ? (riskMap.avg_risk * 100).toFixed(1) : '—'}%
                  </p>
                  <p className="text-gray-600">
                    Resolution: {riskMap.resolution}°
                  </p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Coverage Area</h4>
                <div className="space-y-2 text-sm">
                  <p className="text-gray-600">
                    Lat: {riskMap.bounds?.min_lat?.toFixed(2)}° to {riskMap.bounds?.max_lat?.toFixed(2)}°
                  </p>
                  <p className="text-gray-600">
                    Lon: {riskMap.bounds?.min_lon?.toFixed(2)}° to {riskMap.bounds?.max_lon?.toFixed(2)}°
                  </p>
                  <p className="text-gray-600">
                    Generated: {riskMap.generated_at ? new Date(riskMap.generated_at).toLocaleString() : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
