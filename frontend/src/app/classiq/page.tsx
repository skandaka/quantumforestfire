'use client'

import React, { useState, useEffect } from 'react'
import { 
  Cpu, 
  Zap, 
  Activity, 
  Database, 
  TrendingUp, 
  Shield, 
  BarChart3,
  Layers,
  GitBranch,
  Settings,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import { motion } from 'framer-motion'

interface QuantumMetric {
  label: string
  value: string
  unit: string
  trend: 'up' | 'down' | 'stable'
  description: string
}

interface CircuitStats {
  totalCircuits: number
  activeJobs: number
  qubitsUsed: number
  gateDepth: number
  fidelity: number
  coherenceTime: number
}

export default function ClassiqPage() {
  const [isConnected, setIsConnected] = useState(true)
  const [selectedTab, setSelectedTab] = useState('overview')
  const [circuitStats, setCircuitStats] = useState<CircuitStats>({
    totalCircuits: 47,
    activeJobs: 3,
    qubitsUsed: 127,
    gateDepth: 1847,
    fidelity: 0.9834,
    coherenceTime: 156.8
  })

  const [quantumMetrics] = useState<QuantumMetric[]>([
    {
      label: 'Quantum Volume',
      value: '4096',
      unit: 'QV',
      trend: 'up',
      description: 'Measure of quantum computer capability'
    },
    {
      label: 'Error Rate',
      value: '0.16',
      unit: '%',
      trend: 'down',
      description: 'Current quantum gate error rate'
    },
    {
      label: 'Entanglement',
      value: '99.7',
      unit: '%',
      trend: 'stable',
      description: 'Bell state fidelity measurement'
    },
    {
      label: 'Decoherence',
      value: '127.3',
      unit: 'μs',
      trend: 'up',
      description: 'T2 coherence time for qubits'
    }
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setCircuitStats(prev => ({
        ...prev,
        activeJobs: Math.floor(Math.random() * 8) + 1,
        qubitsUsed: Math.floor(Math.random() * 50) + 100,
        fidelity: 0.98 + Math.random() * 0.01,
        coherenceTime: 150 + Math.random() * 20
      }))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'circuits', label: 'Circuits', icon: GitBranch },
    { id: 'hardware', label: 'Hardware', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-400" />
      case 'down': return <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
      default: return <span className="w-3 h-3 rounded-full bg-blue-400" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-6 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  Quantum Computing Lab
                </span>
              </h1>
              <p className="text-gray-400 text-lg">
                Advanced quantum circuit design and fire prediction modeling
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
                <span className="text-sm text-gray-300">
                  {isConnected ? 'Connected to Classiq Cloud' : 'Disconnected'}
                </span>
              </div>
              <button 
                onClick={() => setIsConnected(!isConnected)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors"
              >
                {isConnected ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Status Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quantumMetrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6 hover:border-purple-500/50 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-gray-400 text-sm font-medium">{metric.label}</h3>
                {getTrendIcon(metric.trend)}
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-2xl font-bold text-white">{metric.value}</span>
                <span className="text-gray-500 text-sm">{metric.unit}</span>
              </div>
              <p className="text-gray-500 text-xs">{metric.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-800/30 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={selectedTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {selectedTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Circuit Statistics */}
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">Circuit Statistics</h3>
                  <RefreshCw className="w-5 h-5 text-gray-400 hover:text-white cursor-pointer transition-colors" />
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Circuits</span>
                    <span className="text-white font-mono">{circuitStats.totalCircuits}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Jobs</span>
                    <span className="text-green-400 font-mono">{circuitStats.activeJobs}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Qubits in Use</span>
                    <span className="text-purple-400 font-mono">{circuitStats.qubitsUsed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Average Gate Depth</span>
                    <span className="text-cyan-400 font-mono">{circuitStats.gateDepth.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Fidelity</span>
                    <span className="text-yellow-400 font-mono">{(circuitStats.fidelity * 100).toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Coherence Time</span>
                    <span className="text-blue-400 font-mono">{circuitStats.coherenceTime.toFixed(1)} μs</span>
                  </div>
                </div>
              </div>

              {/* Quantum Fire Prediction Model */}
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-orange-400" />
                  <h3 className="text-xl font-semibold text-white">Fire Prediction Model</h3>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-lg p-4 border border-orange-500/30">
                    <h4 className="text-orange-400 font-semibold mb-2">Quantum Advantage</h4>
                    <p className="text-gray-300 text-sm mb-3">
                      Our quantum algorithms process complex fire behavior patterns 1000x faster than classical methods.
                    </p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Accuracy:</span>
                        <span className="text-green-400 ml-2 font-mono">94.7%</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Speed:</span>
                        <span className="text-cyan-400 ml-2 font-mono">0.23s</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Weather Integration</span>
                      <span className="text-green-400">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Terrain Analysis</span>
                      <span className="text-green-400">Active</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Quantum Superposition</span>
                      <span className="text-purple-400">Enabled</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Entanglement Depth</span>
                      <span className="text-blue-400">Level 7</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'circuits' && (
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quantum Circuit Library</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }, (_, i) => (
                  <div key={i} className="bg-gray-900/50 border border-gray-600 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-white font-medium">Fire_Prediction_{i + 1}</h4>
                      <GitBranch className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-gray-400 text-sm mb-3">
                      {i % 2 === 0 ? 'Weather pattern analysis' : 'Terrain fire spread modeling'}
                    </p>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Qubits: {8 + i * 2}</span>
                      <span className="text-gray-500">Depth: {150 + i * 50}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'hardware' && (
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quantum Hardware Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="text-purple-400 font-semibold">IBM Quantum Backend</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Backend:</span>
                      <span className="text-white">ibm_osaka</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Qubits:</span>
                      <span className="text-white">127</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-green-400">Online</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="text-cyan-400 font-semibold">Classiq Platform</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">API Status:</span>
                      <span className="text-green-400">Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Synthesis:</span>
                      <span className="text-white">Available</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Optimization:</span>
                      <span className="text-white">Enabled</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'analytics' && (
            <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-white mb-4">Quantum Analytics Dashboard</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Prediction Accuracy Over Time</h4>
                  <div className="h-32 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 rounded flex items-end justify-center">
                    <span className="text-gray-400 text-sm">Chart visualization would go here</span>
                  </div>
                </div>
                <div className="bg-gray-900/50 rounded-lg p-4">
                  <h4 className="text-white font-semibold mb-3">Quantum Resource Usage</h4>
                  <div className="h-32 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded flex items-end justify-center">
                    <span className="text-gray-400 text-sm">Resource metrics visualization</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Powered by Classiq quantum computing platform • 
            IBM Quantum Backend Integration • 
            Real-time fire prediction algorithms
          </p>
        </div>
      </div>
    </div>
  )
}
