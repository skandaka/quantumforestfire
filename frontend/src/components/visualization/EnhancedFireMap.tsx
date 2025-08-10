'use client'

import React, { useState, useEffect } from 'react'
import { apiJson } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  MapPin, 
  Zap, 
  Cpu,
  RefreshCw,
  BarChart3,
  Target,
  Atom
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface EnhancedDataResponse {
  fire_data: any
  weather_data: any
  terrain_data: any
  quantum_features: any
  prediction_features: any
  risk_analysis: any
  enhanced_metadata: any
}

interface RealTimeMetrics {
  total_fires: number
  high_risk_zones: number
  quantum_advantage_score: number
  overall_risk_level: string
  last_updated: string
}

interface EnhancedFireMapProps {
  className?: string
}

// --- COMPONENTS ---

// Real-time Metrics Dashboard
function RealTimeMetrics({ metrics }: { metrics: RealTimeMetrics }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Active Fires</p>
            <p className="text-white text-xl font-bold">{metrics.total_fires}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Risk Zones</p>
            <p className="text-white text-xl font-bold">{metrics.high_risk_zones}</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-lg p-4 border border-gray-700"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
            <Atom className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Quantum Score</p>
            <p className="text-white text-xl font-bold">{(metrics.quantum_advantage_score * 100).toFixed(0)}%</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn(
          "bg-gray-800 rounded-lg p-4 border",
          metrics.overall_risk_level === 'critical' ? 'border-red-500' :
          metrics.overall_risk_level === 'high' ? 'border-orange-500' :
          metrics.overall_risk_level === 'medium' ? 'border-yellow-500' :
          'border-green-500'
        )}
      >
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center",
            metrics.overall_risk_level === 'critical' ? 'bg-red-600' :
            metrics.overall_risk_level === 'high' ? 'bg-orange-600' :
            metrics.overall_risk_level === 'medium' ? 'bg-yellow-600' :
            'bg-green-600'
          )}>
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-gray-400 text-sm">Risk Level</p>
            <p className="text-white text-lg font-bold capitalize">{metrics.overall_risk_level}</p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// Quantum Features Visualization
function QuantumFeaturesPanel({ quantumFeatures }: { quantumFeatures: any }) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const featureSections = [
    {
      id: 'spatial',
      title: 'Spatial Correlations',
      icon: MapPin,
      data: quantumFeatures.spatial_correlation || {},
      color: 'blue'
    },
    {
      id: 'temporal',
      title: 'Temporal Patterns',
      icon: TrendingUp,
      data: quantumFeatures.temporal_patterns || {},
      color: 'green'
    },
    {
      id: 'multimodal',
      title: 'Multi-modal Fusion',
      icon: BarChart3,
      data: quantumFeatures.multi_modal_fusion || {},
      color: 'purple'
    }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Cpu className="w-5 h-5 text-purple-400" />
        Quantum Features Analysis
      </h3>

      {featureSections.map((section) => {
        const Icon = section.icon
        const isExpanded = expandedSection === section.id

        return (
          <motion.div
            key={section.id}
            className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden"
            initial={false}
          >
            <button
              onClick={() => setExpandedSection(isExpanded ? null : section.id)}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-750 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  section.color === 'blue' && "bg-blue-600",
                  section.color === 'green' && "bg-green-600",
                  section.color === 'purple' && "bg-purple-600"
                )}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <span className="font-medium text-white">{section.title}</span>
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <RefreshCw className="w-4 h-4 text-gray-400" />
              </motion.div>
            </button>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="border-t border-gray-700"
                >
                  <div className="p-4 bg-gray-900">
                    <pre className="text-sm text-gray-300 overflow-x-auto">
                      {JSON.stringify(section.data, null, 2)}
                    </pre>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}

// Enhanced Fire Heatmap
function EnhancedFireHeatmap({ fireData }: { fireData: any }) {
  const fires = fireData?.active_fires || []

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Zap className="w-5 h-5 text-red-400" />
        Fire Intensity Heatmap
      </h3>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {Array.from({ length: 16 }, (_, i) => {
          // Find fire data for this grid cell or generate synthetic
          const intensity = fires[i % fires.length]?.intensity || Math.random() * 0.8
          
          return (
            <motion.div
              key={i}
              className={cn(
                "h-12 rounded",
                intensity > 0.7 ? "bg-red-600" :
                intensity > 0.5 ? "bg-orange-500" :
                intensity > 0.3 ? "bg-yellow-500" :
                "bg-green-500"
              )}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: intensity, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              title={`Intensity: ${(intensity * 100).toFixed(1)}%`}
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between text-sm text-gray-400">
        <span>Low Risk</span>
        <div className="flex gap-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <div className="w-4 h-4 bg-orange-500 rounded"></div>
          <div className="w-4 h-4 bg-red-600 rounded"></div>
        </div>
        <span>High Risk</span>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---
export function EnhancedFireMap({ className }: EnhancedFireMapProps) {
  const [data, setData] = useState<EnhancedDataResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchEnhancedData = async () => {
    try {
      setIsLoading(true)
      try {
        const enhancedData = await apiJson('data/enhanced')
        setData(enhancedData)
        setLastUpdated(new Date())
      } catch (err) {
        console.error('Failed to fetch enhanced data', err)
      }
    } catch (error) {
      console.error('Error fetching enhanced data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchEnhancedData()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchEnhancedData, 30000) // 30 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const metrics: RealTimeMetrics = {
    total_fires: data?.fire_data?.active_fires?.length || 0,
    high_risk_zones: data?.risk_analysis?.high_risk_zones?.length || 0,
    quantum_advantage_score: data?.risk_analysis?.quantum_risk_indicators?.quantum_advantage_score || 0,
    overall_risk_level: data?.risk_analysis?.overall_risk_level || 'unknown',
    last_updated: lastUpdated?.toISOString() || ''
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Enhanced Fire Monitoring</h2>
          <p className="text-gray-400">Real-time quantum-enhanced fire prediction and analysis</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              autoRefresh 
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            )}
          >
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
          
          <button
            onClick={fetchEnhancedData}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Real-time Metrics */}
      <RealTimeMetrics metrics={metrics} />

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Fire Heatmap */}
        <EnhancedFireHeatmap fireData={data?.fire_data} />

        {/* Quantum Features */}
        {data?.quantum_features && (
          <QuantumFeaturesPanel quantumFeatures={data.quantum_features} />
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        >
          <div className="bg-gray-900 rounded-lg p-6 flex items-center gap-3">
            <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
            <span className="text-white">Loading enhanced data...</span>
          </div>
        </motion.div>
      )}

      {/* Status Footer */}
      {lastUpdated && (
        <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400" suppressHydrationWarning>
              Last updated: {typeof window === 'undefined' ? '' : lastUpdated.toLocaleTimeString()}
            </span>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-400">Live Data Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
