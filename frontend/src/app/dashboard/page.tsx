'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Activity, Flame, Wind, AlertTriangle, Map, Cpu, Play, Pause } from 'lucide-react'
import { PredictionDashboard } from '@/components/dashboard/PredictionDashboard'
import { QuantumMetrics } from '@/components/quantum/QuantumMetrics'
import { AlertPanel } from '@/components/dashboard/AlertPanel'
import { useQuantumPrediction } from '@/hooks/useQuantumPrediction'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MetricCard } from '@/components/dashboard/MetricCard'
import toast from 'react-hot-toast'

// Dynamic imports for heavy components
const FireVisualization3D = dynamic(
    () => import('@/components/visualization/FireVisualization3D').then(mod => ({ default: mod.FireVisualization3D })),
    {
      ssr: false,
      loading: () => (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="spinner w-8 h-8 mx-auto mb-4"></div>
              <p>Loading 3D Visualization...</p>
            </div>
          </div>
      )
    }
)

const MapView = dynamic(
    () => import('@/components/dashboard/MapView'),
    {
      ssr: false,
      loading: () => (
          <div className="w-full h-full flex items-center justify-center bg-gray-900">
            <div className="text-center text-white">
              <div className="spinner w-8 h-8 mx-auto mb-4"></div>
              <p>Loading Map...</p>
            </div>
          </div>
      )
    }
)

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedModel, setSelectedModel] = useState('ensemble')
  const [isRunningDemo, setIsRunningDemo] = useState(false)

  const { runPrediction, currentPrediction, isPending, systemStatus } = useQuantumPrediction()
  const { activeAlerts, fireData, weatherData, activeFireCount } = useRealTimeData()

  // Mock data for development
  const mockFireData = {
    active_fires: [
      {
        center_lat: 39.7596,
        center_lon: -121.6219,
        intensity: 0.8,
        area_hectares: 150,
        confidence: 0.92,
        detection_time: new Date().toISOString()
      },
      {
        center_lat: 39.8000,
        center_lon: -121.5000,
        intensity: 0.6,
        area_hectares: 75,
        confidence: 0.85,
        detection_time: new Date().toISOString()
      }
    ],
    metadata: {
      source: 'NASA FIRMS',
      total_detections: 2
    }
  }

  const displayFireData = fireData?.active_fires?.length > 0 ? fireData : mockFireData
  const displayWeatherData = weatherData || {
    current_conditions: {
      avg_temperature: 25,
      avg_humidity: 35,
      avg_wind_speed: 15,
      max_wind_speed: 25,
      dominant_wind_direction: 45
    }
  }

  const handleRunPrediction = async () => {
    setIsRunningDemo(true)
    try {
      await runPrediction({
        model: selectedModel,
        location: { latitude: 39.7596, longitude: -121.6219 },
        radius: 50,
        timeHorizon: 24,
        useQuantumHardware: false,
        includeEmberAnalysis: true
      })
      toast.success('Quantum prediction completed successfully!')
    } catch (error) {
      console.error('Prediction error:', error)
      toast.error('Failed to run prediction. Using demo data instead.')

      // Set mock prediction data
      const mockPrediction = {
        prediction_id: `demo_${Date.now()}`,
        status: 'completed',
        timestamp: new Date().toISOString(),
        location: { latitude: 39.7596, longitude: -121.6219, radius_km: 50 },
        predictions: [{
          time_step: 0,
          fire_probability_map: Array(50).fill(null).map(() =>
              Array(50).fill(null).map(() => Math.random() * 0.8)
          ),
          high_risk_cells: [[25, 30], [26, 31], [24, 29]],
          total_area_at_risk: 250
        }],
        metadata: {
          model_type: selectedModel,
          execution_time: 2.3,
          quantum_backend: 'simulator',
          accuracy_estimate: 0.943
        },
        active_fires: displayFireData.active_fires
      }

      // Simulate setting prediction (this would normally be handled by the store)
      console.log('Mock prediction:', mockPrediction)
    } finally {
      setIsRunningDemo(false)
    }
  }

  const sidebarTabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: '3d-visualization', label: '3D View', icon: Flame },
    { id: 'map', label: 'Map View', icon: Map },
    { id: 'quantum', label: 'Quantum', icon: Cpu },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle, badge: activeAlerts.length }
  ]

  return (
      <div className="min-h-screen bg-black text-white">
        {/* Header */}
        <div className="border-b border-gray-800 bg-black/90 backdrop-blur sticky top-0 z-50">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Fire Prediction Dashboard</h1>
                <p className="text-sm text-gray-400 mt-1">
                  Quantum-powered wildfire prediction • System: {systemStatus} • {activeAlerts.length} alerts
                </p>
              </div>

              <div className="flex items-center gap-4">
                <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                    options={[
                      { value: 'ensemble', label: 'Ensemble (Recommended)' },
                      { value: 'classiq_fire_spread', label: 'Classiq Fire Spread' },
                      { value: 'classiq_ember_dynamics', label: 'Classiq Ember Dynamics' },
                      { value: 'qiskit_fire_spread', label: 'Qiskit Fire Model' }
                    ]}
                />

                <Button
                    onClick={handleRunPrediction}
                    disabled={isRunningDemo || isPending}
                    className="quantum-glow"
                >
                  {isRunningDemo ? (
                      <>
                        <div className="spinner w-4 h-4 mr-2" />
                        Running...
                      </>
                  ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" />
                        Run Prediction
                      </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-[calc(100vh-89px)]">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-800 bg-gray-900/50 backdrop-blur flex flex-col">
            {/* Navigation */}
            <nav className="p-4 space-y-2">
              {sidebarTabs.map((tab) => (
                  <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all ${
                          activeTab === tab.id
                              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.badge !== undefined && tab.badge > 0 && (
                        <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {tab.badge}
                  </span>
                    )}
                  </button>
              ))}
            </nav>

            {/* Quick Stats */}
            <div className="p-4 space-y-3 flex-1">
              <h3 className="text-sm font-semibold text-gray-400 mb-3">Live Metrics</h3>

              <MetricCard
                  title="Active Fires"
                  value={displayFireData.active_fires?.length || 0}
                  icon={<Flame className="h-4 w-4" />}
                  className="bg-gray-800/50 p-3"
              />

              <MetricCard
                  title="Wind Speed"
                  value={`${displayWeatherData.current_conditions?.avg_wind_speed || 0} mph`}
                  icon={<Wind className="h-4 w-4" />}
                  className="bg-gray-800/50 p-3"
                  trend={displayWeatherData.current_conditions?.avg_wind_speed > 20 ? 'up' : 'neutral'}
              />

              <MetricCard
                  title="System Status"
                  value={systemStatus}
                  icon={<Activity className="h-4 w-4" />}
                  className="bg-gray-800/50 p-3"
                  trend={systemStatus === 'operational' ? 'up' : 'down'}
              />

              {/* Mini Fire List */}
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-400 mb-2">Recent Fires</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {displayFireData.active_fires?.slice(0, 5).map((fire: any, index: number) => (
                      <div key={index} className="bg-gray-800/30 rounded p-2 text-sm">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Fire #{index + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                              fire.intensity > 0.7 ? 'bg-red-500/20 text-red-400' :
                                  fire.intensity > 0.5 ? 'bg-orange-500/20 text-orange-400' :
                                      'bg-yellow-500/20 text-yellow-400'
                          }`}>
                        {(fire.intensity * 100).toFixed(0)}%
                      </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {fire.center_lat?.toFixed(3)}°, {fire.center_lon?.toFixed(3)}°
                        </div>
                        <div className="text-xs text-gray-400">
                          {fire.area_hectares} hectares
                        </div>
                      </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'overview' && (
                <PredictionDashboard
                    prediction={currentPrediction}
                    fireData={displayFireData}
                    weatherData={displayWeatherData}
                />
            )}

            {activeTab === '3d-visualization' && (
                <FireVisualization3D
                    predictionData={currentPrediction || displayFireData}
                    showEmbers={true}
                    showQuantumField={false}
                    showTerrain={true}
                    interactive={true}
                />
            )}

            {activeTab === 'map' && (
                <MapView
                    fireData={displayFireData}
                    predictionData={currentPrediction}
                    center={[-121.6219, 39.7596]}
                    zoom={9}
                    showEmberPrediction={!!currentPrediction}
                />
            )}

            {activeTab === 'quantum' && <QuantumMetrics />}
            {activeTab === 'alerts' && <AlertPanel alerts={activeAlerts} />}
          </div>
        </div>
      </div>
  )
}