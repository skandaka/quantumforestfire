'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Square, 
  RotateCcw, 
  Settings, 
  Cpu, 
  Zap, 
  Activity,
  ChevronDown,
  ChevronRight,
  Monitor,
  Cloud,
  Gauge,
  Target
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface QuantumBackend {
  id: string
  name: string
  type: 'simulator' | 'hardware'
  qubits: number
  status: 'online' | 'offline' | 'busy'
  queue: number
  noise: number
}

interface QuantumControlsProps {
  isExecuting?: boolean
  isConnected?: boolean
  selectedBackend?: string
  onExecute?: () => void
  onPause?: () => void
  onStop?: () => void
  onReset?: () => void
  onBackendChange?: (backendId: string) => void
  onSettingsChange?: (settings: QuantumSettings) => void
  className?: string
}

interface QuantumSettings {
  shots: number
  optimization: number
  noiseModel: boolean
  errorCorrection: boolean
  maxDepth: number
}

// --- MOCK DATA ---
const quantumBackends: QuantumBackend[] = [
  {
    id: 'aer_simulator',
    name: 'Qiskit Aer Simulator',
    type: 'simulator',
    qubits: 32,
    status: 'online',
    queue: 0,
    noise: 0
  },
  {
    id: 'ibm_lagos',
    name: 'IBM Lagos (7 qubits)',
    type: 'hardware',
    qubits: 7,
    status: 'online',
    queue: 12,
    noise: 0.15
  },
  {
    id: 'ibm_perth',
    name: 'IBM Perth (7 qubits)',
    type: 'hardware',
    qubits: 7,
    status: 'busy',
    queue: 28,
    noise: 0.12
  },
  {
    id: 'classiq_simulator',
    name: 'Classiq Simulator',
    type: 'simulator',
    qubits: 50,
    status: 'online',
    queue: 0,
    noise: 0
  }
]

// --- COMPONENTS ---

// Backend Selector
function BackendSelector({ 
  selectedBackend, 
  onBackendChange, 
  className 
}: { 
  selectedBackend?: string, 
  onBackendChange?: (backendId: string) => void,
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  const selected = quantumBackends.find(b => b.id === selectedBackend) || quantumBackends[0]
  
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-3">
          {selected.type === 'simulator' ? (
            <Monitor className="w-5 h-5 text-blue-400" />
          ) : (
            <Cpu className="w-5 h-5 text-purple-400" />
          )}
          <div className="text-left">
            <div className="font-medium text-white">{selected.name}</div>
            <div className="text-xs text-gray-400 flex items-center gap-2">
              <span>{selected.qubits} qubits</span>
              <div className={cn(
                "w-2 h-2 rounded-full",
                selected.status === 'online' ? 'bg-green-400' :
                selected.status === 'busy' ? 'bg-yellow-400' : 'bg-red-400'
              )} />
              <span className="capitalize">{selected.status}</span>
            </div>
          </div>
        </div>
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 max-h-64 overflow-y-auto"
          >
            {quantumBackends.map((backend) => (
              <button
                key={backend.id}
                onClick={() => {
                  onBackendChange?.(backend.id)
                  setIsOpen(false)
                }}
                className={cn(
                  "w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0",
                  backend.id === selectedBackend && "bg-gray-700"
                )}
              >
                <div className="flex items-center gap-3">
                  {backend.type === 'simulator' ? (
                    <Monitor className="w-5 h-5 text-blue-400" />
                  ) : (
                    <Cpu className="w-5 h-5 text-purple-400" />
                  )}
                  <div className="flex-1">
                    <div className="font-medium text-white">{backend.name}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-3">
                      <span>{backend.qubits} qubits</span>
                      <div className="flex items-center gap-1">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          backend.status === 'online' ? 'bg-green-400' :
                          backend.status === 'busy' ? 'bg-yellow-400' : 'bg-red-400'
                        )} />
                        <span className="capitalize">{backend.status}</span>
                      </div>
                      {backend.queue > 0 && (
                        <span>Queue: {backend.queue}</span>
                      )}
                      {backend.noise > 0 && (
                        <span>Noise: {(backend.noise * 100).toFixed(1)}%</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Settings Panel
function SettingsPanel({ 
  settings, 
  onChange, 
  className 
}: { 
  settings: QuantumSettings, 
  onChange?: (settings: QuantumSettings) => void,
  className?: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const updateSettings = (key: keyof QuantumSettings, value: any) => {
    onChange?.({ ...settings, [key]: value })
  }
  
  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        <Settings className="w-4 h-4" />
        Settings
        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 p-4 min-w-80"
          >
            <div className="space-y-4">
              {/* Shots */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Number of Shots
                </label>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={settings.shots}
                  onChange={(e) => updateSettings('shots', parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>100</span>
                  <span className="font-medium text-white">{settings.shots}</span>
                  <span>10,000</span>
                </div>
              </div>
              
              {/* Optimization Level */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Optimization Level
                </label>
                <select
                  value={settings.optimization}
                  onChange={(e) => updateSettings('optimization', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value={0}>None (0)</option>
                  <option value={1}>Light (1)</option>
                  <option value={2}>Medium (2)</option>
                  <option value={3}>Heavy (3)</option>
                </select>
              </div>
              
              {/* Max Circuit Depth */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Circuit Depth
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={settings.maxDepth}
                  onChange={(e) => updateSettings('maxDepth', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                />
              </div>
              
              {/* Toggles */}
              <div className="space-y-3">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.noiseModel}
                    onChange={(e) => updateSettings('noiseModel', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">Include Noise Model</span>
                </label>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={settings.errorCorrection}
                    onChange={(e) => updateSettings('errorCorrection', e.target.checked)}
                    className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-300">Error Correction</span>
                </label>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// --- MAIN COMPONENT ---
export function QuantumControls({
  isExecuting = false,
  isConnected = true,
  selectedBackend = 'aer_simulator',
  onExecute,
  onPause,
  onStop,
  onReset,
  onBackendChange,
  onSettingsChange,
  className
}: QuantumControlsProps) {
  const [settings, setSettings] = useState<QuantumSettings>({
    shots: 1000,
    optimization: 2,
    noiseModel: false,
    errorCorrection: false,
    maxDepth: 50
  })
  
  const [executionTime, setExecutionTime] = useState(0)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected')
  
  // Execution timer
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isExecuting) {
      interval = setInterval(() => {
        setExecutionTime(prev => prev + 1)
      }, 1000)
    } else {
      setExecutionTime(0)
    }
    return () => clearInterval(interval)
  }, [isExecuting])
  
  // Settings change handler
  useEffect(() => {
    onSettingsChange?.(settings)
  }, [settings, onSettingsChange])
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  const selectedBackendInfo = quantumBackends.find(b => b.id === selectedBackend)
  
  return (
    <div className={cn("bg-gray-900 rounded-lg p-6 space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Quantum Execution Control</h2>
          <p className="text-gray-400">Configure and execute quantum circuits</p>
        </div>
        
        <div className="flex items-center gap-2">
          <div className={cn(
            "w-3 h-3 rounded-full",
            connectionStatus === 'connected' ? 'bg-green-400' :
            connectionStatus === 'connecting' ? 'bg-yellow-400 animate-pulse' :
            'bg-red-400'
          )} />
          <span className="text-sm text-gray-300 capitalize">{connectionStatus}</span>
        </div>
      </div>
      
      {/* Backend Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">
          Quantum Backend
        </label>
        <BackendSelector
          selectedBackend={selectedBackend}
          onBackendChange={onBackendChange}
        />
      </div>
      
      {/* Execution Controls */}
      <div className="grid grid-cols-4 gap-3">
        <motion.button
          onClick={onExecute}
          disabled={!isConnected || isExecuting}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
            !isConnected || isExecuting
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700 text-white"
          )}
          whileHover={{ scale: !isConnected || isExecuting ? 1 : 1.02 }}
          whileTap={{ scale: !isConnected || isExecuting ? 1 : 0.98 }}
        >
          <Play className="w-4 h-4" />
          Execute
        </motion.button>
        
        <motion.button
          onClick={onPause}
          disabled={!isExecuting}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
            !isExecuting
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-yellow-600 hover:bg-yellow-700 text-white"
          )}
          whileHover={{ scale: !isExecuting ? 1 : 1.02 }}
          whileTap={{ scale: !isExecuting ? 1 : 0.98 }}
        >
          <Pause className="w-4 h-4" />
          Pause
        </motion.button>
        
        <motion.button
          onClick={onStop}
          disabled={!isExecuting}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors",
            !isExecuting
              ? "bg-gray-700 text-gray-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700 text-white"
          )}
          whileHover={{ scale: !isExecuting ? 1 : 1.02 }}
          whileTap={{ scale: !isExecuting ? 1 : 0.98 }}
        >
          <Square className="w-4 h-4" />
          Stop
        </motion.button>
        
        <motion.button
          onClick={onReset}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-4 h-4" />
          Reset
        </motion.button>
      </div>
      
      {/* Execution Status */}
      {isExecuting && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-purple-900/30 border border-purple-500/50 rounded-lg p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
              <span className="font-medium text-purple-300">Executing on {selectedBackendInfo?.name}</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-purple-200">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span>{formatTime(executionTime)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4" />
                <span>{settings.shots} shots</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Settings */}
      <div className="flex items-center justify-between">
        <SettingsPanel
          settings={settings}
          onChange={setSettings}
        />
        
        <div className="flex items-center gap-4 text-sm text-gray-400">
          <div className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            <span>Opt: {settings.optimization}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span>{settings.shots} shots</span>
          </div>
          <div className="flex items-center gap-1">
            <Cloud className="w-4 h-4" />
            <span>{settings.noiseModel ? 'Noisy' : 'Ideal'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}