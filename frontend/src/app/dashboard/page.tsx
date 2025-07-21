'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Activity, Flame, Wind, AlertTriangle, Map, Cpu, BarChart3, Settings } from 'lucide-react'
import { PredictionDashboard } from '@/components/dashboard/PredictionDashboard'
import { QuantumMetrics } from '@/components/quantum/QuantumMetrics'
import { AlertPanel } from '@/components/dashboard/AlertPanel'
import { useQuantumPrediction } from '@/hooks/useQuantumPrediction'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import toast from 'react-hot-toast'

// Dynamic imports for heavy 3D components
const FireVisualization3D = dynamic(
  () => import('@/components/visualization/FireVisualization3D').then(mod => ({ default: mod.FireVisualization3D })),
  {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><div className="spinner" /></div>
  }
)

const MapView = dynamic(
  () => import('@/components/dashboard/MapView'),
  {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center"><div className="spinner" /></div>
  }
)

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedModel, setSelectedModel] = useState('ensemble')
  const [timeHorizon, setTimeHorizon] = useState('24')
  const [isRunningPrediction, setIsRunningPrediction] = useState(false)

  const { runPrediction, currentPrediction, isLoading } = useQuantumPrediction()
  const { activeAlerts, fireData, weatherData, subscribeToUpdates } = useRealTimeData()

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToUpdates((update) => {
      if (update.type === 'alert' && update.severity === 'critical') {
        toast.error(update.message, { duration: 10000 })
      }
    })

    return () => unsubscribe()
  }, [subscribeToUpdates])

  const handleRunPrediction = async () => {
    setIsRunningPrediction(true)
    try {
      await runPrediction({
        model: selectedModel,
        timeHorizon: parseInt(timeHorizon),
        location: { latitude: 39.7596, longitude: -121.6219 }, // Default to Paradise, CA
        radius: 50
      })
      toast.success('Quantum prediction completed successfully')
    } catch (error) {
      toast.error('Failed to run prediction')
    } finally {
      setIsRunningPrediction(false)
    }
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fire Prediction Dashboard</h1>
              <p className="text-sm text-gray-400 mt-1">
                Real-time quantum analysis • {activeAlerts.length} active alerts
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Model Selection */}
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                options={[
                  { value: 'ensemble', label: 'Ensemble (All Models)' },
                  { value: 'classiq_fire_spread', label: 'Classiq Fire Spread' },
                  { value: 'classiq_ember_dynamics', label: 'Classiq Ember Dynamics' },
                  { value: 'qiskit_fire_spread', label: 'Qiskit Fire Model' }
                ]}
              />

              {/* Time Horizon */}
              <Select
                value={timeHorizon}
                onValueChange={setTimeHorizon}
                options={[
                  { value: '6', label: '6 hours' },
                  { value: '12', label: '12 hours' },
                  { value: '24', label: '24 hours' },
                  { value: '48', label: '48 hours' }
                ]}
              />

              {/* Run Prediction */}
              <Button
                onClick={handleRunPrediction}
                disabled={isRunningPrediction || isLoading}
                className="quantum-glow"
              >
                {isRunningPrediction ? (
                  <>
                    <div className="spinner w-4 h-4 mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4 mr-2" />
                    Run Prediction
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Sidebar */}
        <div className="w-64 border-r border-gray-800 bg-black/50 backdrop-blur p-4">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'overview' 
                  ? 'bg-red-500/20 text-red-500' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('3d-visualization')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === '3d-visualization' 
                  ? 'bg-red-500/20 text-red-500' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Flame className="w-5 h-5" />
              <span>3D Visualization</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'map' 
                  ? 'bg-red-500/20 text-red-500' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Map className="w-5 h-5" />
              <span>Map View</span>
            </button>

            <button
              onClick={() => setActiveTab('quantum')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'quantum' 
                  ? 'bg-red-500/20 text-red-500' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Cpu className="w-5 h-5" />
              <span>Quantum Metrics</span>
            </button>

            <button
              onClick={() => setActiveTab('alerts')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === 'alerts' 
                  ? 'bg-red-500/20 text-red-500' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              <span>Alerts</span>
              {activeAlerts.length > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                  {activeAlerts.length}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Stats */}
          <div className="mt-8 space-y-4">
            <div className="glass rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Active Fires</div>
              <div className="text-2xl font-bold text-red-500">
                {fireData?.active_fires?.length || 0}
              </div>
            </div>

            <div className="glass rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Wind Speed</div>
              <div className="text-2xl font-bold text-orange-500">
                {weatherData?.current_conditions?.avg_wind_speed?.toFixed(1) || '0'} mph
              </div>
            </div>

            <div className="glass rounded-lg p-4">
              <div className="text-xs text-gray-400 mb-1">Humidity</div>
              <div className="text-2xl font-bold text-blue-500">
                {weatherData?.current_conditions?.avg_humidity?.toFixed(0) || '0'}%
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'overview' && (
            <PredictionDashboard
              prediction={currentPrediction}
              fireData={fireData}
              weatherData={weatherData}
            />
          )}

          {activeTab === '3d-visualization' && (
            <div className="h-full">
              <FireVisualization3D
                predictionData={currentPrediction}
                showEmbers={true}
                showQuantumField={true}
                showTerrain={true}
              />
            </div>
          )}

          {activeTab === 'map' && (
            <MapView
              fireData={fireData}
              predictionData={currentPrediction}
              center={[39.7596, -121.6219]}
              zoom={10}
            />
          )}

          {activeTab === 'quantum' && (
            <QuantumMetrics />
          )}

          {activeTab === 'alerts' && (
            <AlertPanel alerts={activeAlerts} />
          )}
        </div>
      </div>
    </div>
  )
}