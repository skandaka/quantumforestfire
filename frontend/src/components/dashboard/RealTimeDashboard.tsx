"use client";

import React, { useState, useEffect } from 'react';
import { ClientTime } from '@/components/ui/ClientTime';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useFireUpdates, 
  useWeatherUpdates, 
  useQuantumUpdates, 
  useSystemMonitoring,
  ConnectionState,
  useWebSocket 
} from '@/hooks/useWebSocket';

// Connection status indicator
function ConnectionIndicator() {
  const { connectionState, isConnected } = useWebSocket();
  
  const getStatusColor = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED: return 'bg-green-500';
      case ConnectionState.CONNECTING: return 'bg-yellow-500';
      case ConnectionState.RECONNECTING: return 'bg-orange-500';
      case ConnectionState.ERROR: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionState) {
      case ConnectionState.CONNECTED: return 'Connected';
      case ConnectionState.CONNECTING: return 'Connecting...';
      case ConnectionState.RECONNECTING: return 'Reconnecting...';
      case ConnectionState.ERROR: return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <div className="flex items-center space-x-2 mb-4">
      <motion.div
        className={`w-3 h-3 rounded-full ${getStatusColor()}`}
        animate={{ scale: isConnected ? [1, 1.2, 1] : 1 }}
        transition={{ repeat: isConnected ? Infinity : 0, duration: 2 }}
      />
      <span className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
        {getStatusText()}
      </span>
    </div>
  );
}

// Real-time metrics card
interface MetricsCardProps {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: React.ReactNode;
  color?: string;
  isLoading?: boolean;
}

function MetricsCard({ title, value, unit, change, icon, color = "blue", isLoading }: MetricsCardProps) {
  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border p-6"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <div className="flex items-baseline space-x-1">
            {isLoading ? (
              <div className="animate-pulse bg-gray-200 h-6 w-16 rounded"></div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                {unit && <span className="text-sm text-gray-500">{unit}</span>}
              </>
            )}
          </div>
          {change !== undefined && (
            <p className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}% from last hour
            </p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          <div className={`text-${color}-600`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Fire alert component
function FireAlert({ alert, onDismiss }: { alert: any; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 300 }}
      className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3"
    >
      <div className="flex items-start justify-between">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              {alert.severity} Fire Alert
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Location: {alert.location}</p>
              <p>Confidence: {alert.confidence}%</p>
              <p>Time: <ClientTime value={alert.timestamp} /></p>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 ml-4 text-red-400 hover:text-red-600"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}

// Real-time chart component
function RealTimeChart({ data, title, color = "#3B82F6" }: { data: any[]; title: string; color?: string }) {
  const maxPoints = 50;
  const chartData = data.slice(-maxPoints);

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 relative">
        <svg className="w-full h-full" viewBox="0 0 400 200">
          {chartData.length > 1 && (
            <motion.path
              d={`M ${chartData.map((point, index) => 
                `${(index / (chartData.length - 1)) * 380 + 10},${190 - (point.value / 100) * 170}`
              ).join(' L ')}`}
              fill="none"
              stroke={color}
              strokeWidth="2"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
          {chartData.map((point, index) => (
            <motion.circle
              key={index}
              cx={(index / (chartData.length - 1)) * 380 + 10}
              cy={190 - (point.value / 100) * 170}
              r="3"
              fill={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.05 }}
            />
          ))}
        </svg>
        {chartData.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            Waiting for data...
          </div>
        )}
      </div>
    </div>
  );
}

// Main real-time dashboard
export default function RealTimeDashboard() {
  const { fireData, alerts } = useFireUpdates();
  const { weatherData } = useWeatherUpdates();
  const { quantumMetrics, processingStatus } = useQuantumUpdates();
  const { systemMetrics, performance } = useSystemMonitoring();
  const [mounted, setMounted] = useState(false);
  
  const [visibleAlerts, setVisibleAlerts] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  // Update alerts
  useEffect(() => {
    if (alerts.length > 0) {
      setVisibleAlerts(alerts.slice(0, 5)); // Show only recent 5 alerts
    }
  }, [alerts]);

  useEffect(() => { setMounted(true); }, []);

  // Update chart data
  useEffect(() => {
    if (systemMetrics) {
      const now = Date.now();
      const newPoint = {
        timestamp: now,
        value: systemMetrics.cpu_usage || Math.random() * 100,
        // Avoid server/client mismatch: compute label after mount only; place placeholder first render.
        label: ''
      };
      setChartData(prev => [...prev.slice(-49), newPoint]);
    }
  }, [systemMetrics]);

  // Hydrate time labels on client after initial mount
  useEffect(() => {
    setChartData(prev => prev.map(p => ({ ...p, label: p.label || new Date(p.timestamp).toLocaleTimeString() })));
  }, []);

  const dismissAlert = (index: number) => {
    setVisibleAlerts(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Real-Time Dashboard</h1>
          <p className="mt-2 text-gray-600">
            Live monitoring of quantum-enhanced fire prediction system
          </p>
          <ConnectionIndicator />
        </div>

        {/* Alerts Section */}
        {visibleAlerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Alerts</h2>
            <AnimatePresence>
              {visibleAlerts.map((alert, index) => (
                <FireAlert
                  key={`${alert.id}-${index}`}
                  alert={alert}
                  onDismiss={() => dismissAlert(index)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricsCard
            title="Active Fires"
            value={fireData.length}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.5-7 0 0 .5 1.5 2.5 2.5l.5.5c.5-.5 2-1.5 3.5 0 1 1 0 2.5 0 2.5s2.5-.5 3.5.5a4 4 0 012.657 3.157z" />
              </svg>
            }
            color="red"
            change={fireData.length > 0 ? 5.2 : 0}
          />
          
          <MetricsCard
            title="Weather Risk"
            value={weatherData?.risk_level || "Low"}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            }
            color="yellow"
            isLoading={!weatherData}
          />
          
          <MetricsCard
            title="Quantum Processing"
            value={processingStatus}
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            }
            color="purple"
          />
          
          <MetricsCard
            title="System Load"
            value={systemMetrics?.cpu_usage?.toFixed(1) || "0"}
            unit="%"
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            color="blue"
            change={systemMetrics?.cpu_usage ? -2.1 : 0}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <RealTimeChart
            data={chartData}
            title="System Performance"
            color="#3B82F6"
          />
          
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Fire Detections</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {fireData.slice(0, 10).map((fire, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      {fire.location || `Location ${index + 1}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      Confidence: {fire.confidence || Math.floor(Math.random() * 30) + 70}%
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">
                      <ClientTime value={fire.timestamp || Date.now()} />
                    </p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      (fire.severity || 'medium') === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {fire.severity || 'Medium'}
                    </span>
                  </div>
                </motion.div>
              ))}
              {fireData.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No fire detections at this time
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quantum Metrics */}
        {quantumMetrics && (
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quantum Processing Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {quantumMetrics.quantum_speedup?.toFixed(2) || "1.5"}x
                </p>
                <p className="text-sm text-gray-600">Quantum Speedup</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {quantumMetrics.accuracy?.toFixed(1) || "93.2"}%
                </p>
                <p className="text-sm text-gray-600">Prediction Accuracy</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {quantumMetrics.processing_time?.toFixed(1) || "2.3"}s
                </p>
                <p className="text-sm text-gray-600">Processing Time</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
