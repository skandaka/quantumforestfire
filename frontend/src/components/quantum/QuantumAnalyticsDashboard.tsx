'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { apiJson } from '@/lib/api'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Atom, 
  Brain, 
  Cpu, 
  Zap, 
  Target, 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Activity,
  Settings,
  RefreshCw,
  Download,
  Maximize2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface QuantumMetrics {
  entanglement_strength: number
  coherence_time: number
  quantum_advantage_score: number
  fidelity: number
  gate_error_rate: number
  decoherence_rate: number
}

interface SpatialCorrelation {
  correlation_matrix: number[][]
  eigenvalues: number[]
  coherent_regions: any[]
  quantum_clusters: any[]
}

interface TemporalPattern {
  temporal_correlations: number[]
  quantum_states: any[]
  evolution_operators: number[][]
  prediction_horizon: number
}

interface QuantumAnalyticsData {
  metrics: QuantumMetrics
  spatial_correlations: SpatialCorrelation
  temporal_patterns: TemporalPattern
  multimodal_fusion: any
  quantum_circuits: any[]
  performance_benchmarks: any
}

interface QuantumAnalyticsDashboardProps {
  className?: string
}

// --- UTILITY FUNCTIONS ---
const generateColorFromValue = (value: number, alpha = 1) => {
  if (value > 0.8) return `rgba(239, 68, 68, ${alpha})` // red
  if (value > 0.6) return `rgba(245, 158, 11, ${alpha})` // orange
  if (value > 0.4) return `rgba(34, 197, 94, ${alpha})` // green
  return `rgba(59, 130, 246, ${alpha})` // blue
}

// --- COMPONENTS ---

// Quantum Metrics Overview
function QuantumMetricsOverview({ metrics }: { metrics: QuantumMetrics }) {
  const metricItems = [
    {
      key: 'entanglement_strength',
      label: 'Entanglement',
      value: metrics.entanglement_strength,
      unit: '',
      icon: Atom,
      color: 'purple'
    },
    {
      key: 'coherence_time',
      label: 'Coherence',
      value: metrics.coherence_time,
      unit: 'μs',
      icon: Brain,
      color: 'blue'
    },
    {
      key: 'quantum_advantage_score',
      label: 'Advantage',
      value: metrics.quantum_advantage_score,
      unit: '',
      icon: Zap,
      color: 'green'
    },
    {
      key: 'fidelity',
      label: 'Fidelity',
      value: metrics.fidelity,
      unit: '',
      icon: Target,
      color: 'orange'
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metricItems.map((item, index) => {
        const Icon = item.icon
        return (
          <motion.div
            key={item.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center",
                item.color === 'purple' && "bg-purple-600",
                item.color === 'blue' && "bg-blue-600", 
                item.color === 'green' && "bg-green-600",
                item.color === 'orange' && "bg-orange-600"
              )}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <span className="text-xs text-gray-400">{item.unit}</span>
            </div>
            
            <div className="mb-2">
              <p className="text-2xl font-bold text-white">
                {(item.value * 100).toFixed(1)}
                {item.unit ? '' : '%'}
              </p>
              <p className="text-sm text-gray-400">{item.label}</p>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                className={cn(
                  "h-2 rounded-full",
                  item.color === 'purple' && "bg-purple-500",
                  item.color === 'blue' && "bg-blue-500",
                  item.color === 'green' && "bg-green-500", 
                  item.color === 'orange' && "bg-orange-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${item.value * 100}%` }}
                transition={{ delay: index * 0.1 + 0.3 }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Correlation Matrix Heatmap
function CorrelationMatrixHeatmap({ data }: { data: SpatialCorrelation }) {
  const matrix = data.correlation_matrix || []
  const size = matrix.length

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-purple-400" />
        Spatial Correlation Matrix
      </h3>

      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(size, 8)}, 1fr)` }}>
        {matrix.slice(0, 8).map((row, i) => 
          row.slice(0, 8).map((value, j) => (
            <motion.div
              key={`${i}-${j}`}
              className="aspect-square rounded"
              style={{ 
                backgroundColor: generateColorFromValue(Math.abs(value), 0.8)
              }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (i * 8 + j) * 0.02 }}
              title={`Correlation: ${value?.toFixed(3) || 'N/A'}`}
            />
          ))
        )}
      </div>

      <div className="flex items-center justify-between mt-3 text-sm">
        <span className="text-gray-400">Low Correlation</span>
        <div className="flex gap-1">
          {[0.2, 0.4, 0.6, 0.8, 1.0].map(val => (
            <div 
              key={val}
              className="w-4 h-4 rounded"
              style={{ backgroundColor: generateColorFromValue(val) }}
            />
          ))}
        </div>
        <span className="text-gray-400">High Correlation</span>
      </div>
    </div>
  )
}

// Temporal Evolution Chart
function TemporalEvolutionChart({ data }: { data: TemporalPattern }) {
  const correlations = data.temporal_correlations || []
  const maxValue = Math.max(...correlations, 1)

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        Temporal Evolution Patterns
      </h3>

      <div className="h-40 flex items-end gap-1">
        {Array.from({ length: 24 }, (_, i) => {
          const value = correlations[i] || Math.random() * 0.8
          const height = (value / maxValue) * 100
          
          return (
            <motion.div
              key={i}
              className="flex-1 bg-gradient-to-t from-green-600 to-green-400 rounded-t"
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.05 }}
              title={`Time ${i}: ${value.toFixed(3)}`}
            />
          )
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>t=0</span>
        <span>Prediction Horizon: {data.prediction_horizon || 24}h</span>
      </div>
    </div>
  )
}

// Quantum Circuit Visualization
function QuantumCircuitVisualization({ circuits }: { circuits: any[] }) {
  const [selectedCircuit, setSelectedCircuit] = useState(0)
  
  const circuit = circuits[selectedCircuit] || { 
    qubits: 4, 
    gates: ['H', 'CNOT', 'RZ', 'MEASURE'],
    depth: 5,
    fidelity: 0.95 + Math.random() * 0.05
  }

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-blue-400" />
          Quantum Circuits
        </h3>
        
        <select
          value={selectedCircuit}
          onChange={(e) => setSelectedCircuit(Number(e.target.value))}
          className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 text-sm"
        >
          {circuits.map((_, index) => (
            <option key={index} value={index}>
              Circuit {index + 1}
            </option>
          ))}
          {circuits.length === 0 && <option value={0}>Demo Circuit</option>}
        </select>
      </div>

      {/* Circuit Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-sm">
          <span className="text-gray-400">Qubits:</span>
          <span className="text-white ml-2 font-medium">{circuit.qubits}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Depth:</span>
          <span className="text-white ml-2 font-medium">{circuit.depth}</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Fidelity:</span>
          <span className="text-white ml-2 font-medium">{(circuit.fidelity * 100).toFixed(1)}%</span>
        </div>
        <div className="text-sm">
          <span className="text-gray-400">Gates:</span>
          <span className="text-white ml-2 font-medium">{circuit.gates.length}</span>
        </div>
      </div>

      {/* Simple Circuit Visualization */}
      <div className="bg-gray-900 rounded p-4">
        <div className="space-y-3">
          {Array.from({ length: circuit.qubits }, (_, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-400 text-xs w-8">q{i}</span>
              <div className="flex-1 h-0.5 bg-gray-600"></div>
              <div className="flex gap-2">
                {circuit.gates.slice(0, 4).map((gate: string, j: number) => (
                  <motion.div
                    key={j}
                    className={cn(
                      "w-8 h-6 rounded text-xs flex items-center justify-center text-white font-medium",
                      gate === 'H' && "bg-purple-600",
                      gate === 'CNOT' && "bg-blue-600",
                      gate === 'RZ' && "bg-green-600",
                      gate === 'MEASURE' && "bg-orange-600"
                    )}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: j * 0.1 }}
                  >
                    {gate === 'CNOT' ? '⊕' : gate.charAt(0)}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Performance Benchmarks
function PerformanceBenchmarks({ benchmarks }: { benchmarks: any }) {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const metrics = [
    { 
      name: 'Classical Accuracy', 
      value: benchmarks?.classical_accuracy || 0.82, 
      color: 'blue' 
    },
    { 
      name: 'Quantum Accuracy', 
      value: benchmarks?.quantum_accuracy || 0.91, 
      color: 'purple' 
    },
    { 
      name: 'Speedup Factor', 
      value: (benchmarks?.speedup_factor || 2.3) / 10, 
      color: 'green',
      display: `${benchmarks?.speedup_factor || 2.3}x`
    },
    { 
      name: 'Error Rate', 
      value: 1 - (benchmarks?.error_rate || 0.05), 
      color: 'orange' 
    }
  ]

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-4"
      >
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Performance Benchmarks
        </h3>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-5 h-5 text-gray-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {metrics.map((metric, index) => (
              <div key={metric.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">{metric.name}</span>
                  <span className="text-white font-medium">
                    {metric.display || `${(metric.value * 100).toFixed(1)}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className={cn(
                      "h-2 rounded-full",
                      metric.color === 'blue' && "bg-blue-500",
                      metric.color === 'purple' && "bg-purple-500",
                      metric.color === 'green' && "bg-green-500",
                      metric.color === 'orange' && "bg-orange-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value * 100}%` }}
                    transition={{ delay: index * 0.1 }}
                  />
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- MAIN COMPONENT ---
export function QuantumAnalyticsDashboard({ className }: QuantumAnalyticsDashboardProps) {
  const [data, setData] = useState<QuantumAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchQuantumAnalytics = async () => {
    try {
      setIsLoading(true)
      try {
        const quantumData = await apiJson('data/quantum-features')
        setData(quantumData)
      } catch (_) {
        // Fallback to mock data
        setData({
          metrics: {
            entanglement_strength: 0.85,
            coherence_time: 120.5,
            quantum_advantage_score: 0.78,
            fidelity: 0.94,
            gate_error_rate: 0.02,
            decoherence_rate: 0.001
          },
          spatial_correlations: {
            correlation_matrix: Array.from({ length: 8 }, () => 
              Array.from({ length: 8 }, () => Math.random() * 2 - 1)
            ),
            eigenvalues: Array.from({ length: 8 }, () => Math.random()),
            coherent_regions: [],
            quantum_clusters: []
          },
          temporal_patterns: {
            temporal_correlations: Array.from({ length: 24 }, () => Math.random()),
            quantum_states: [],
            evolution_operators: [],
            prediction_horizon: 24
          },
          multimodal_fusion: {},
          quantum_circuits: [
            { qubits: 4, gates: ['H', 'CNOT', 'RZ', 'MEASURE'], depth: 5, fidelity: 0.95 },
            { qubits: 6, gates: ['H', 'CZ', 'RY', 'MEASURE'], depth: 7, fidelity: 0.92 }
          ],
          performance_benchmarks: {
            classical_accuracy: 0.82,
            quantum_accuracy: 0.91,
            speedup_factor: 2.3,
            error_rate: 0.05
          }
        })
      }
    } catch (error) {
      console.error('Error fetching quantum analytics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQuantumAnalytics()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchQuantumAnalytics, 10000) // 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  if (isLoading || !data) {
    return (
      <div className={cn("flex items-center justify-center py-12", className)}>
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-purple-400 animate-spin" />
          <span className="text-white">Loading quantum analytics...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Quantum Analytics Dashboard</h2>
          <p className="text-gray-400">Advanced quantum processing metrics and insights</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              autoRefresh 
                ? "bg-purple-600 hover:bg-purple-700 text-white"
                : "bg-gray-700 hover:bg-gray-600 text-gray-300"
            )}
          >
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </button>
          
          <button
            onClick={fetchQuantumAnalytics}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quantum Metrics Overview */}
      <QuantumMetricsOverview metrics={data.metrics} />

      {/* Main Analytics Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Correlation Matrix */}
        <CorrelationMatrixHeatmap data={data.spatial_correlations} />

        {/* Temporal Evolution */}
        <TemporalEvolutionChart data={data.temporal_patterns} />

        {/* Quantum Circuits */}
        <QuantumCircuitVisualization circuits={data.quantum_circuits} />

        {/* Performance Benchmarks */}
        <PerformanceBenchmarks benchmarks={data.performance_benchmarks} />
      </div>
    </div>
  )
}
