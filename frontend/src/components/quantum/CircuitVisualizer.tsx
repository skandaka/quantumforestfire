'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Zap, Activity, Target, Layers, Info, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface QuantumGate {
  id: string
  type: 'H' | 'X' | 'Y' | 'Z' | 'CNOT' | 'RX' | 'RY' | 'RZ' | 'Toffoli' | 'Measure'
  qubits: number[]
  parameters?: number[]
  position: { x: number, y: number }
  isActive?: boolean
}

interface QuantumState {
  amplitudes: Complex[]
  probabilities: number[]
  entanglement: number
  coherence: number
}

interface Complex {
  real: number
  imaginary: number
}

interface CircuitVisualizerProps {
  circuit?: QuantumGate[]
  numQubits?: number
  isExecuting?: boolean
  onGateAdd?: (gate: QuantumGate) => void
  onGateRemove?: (gateId: string) => void
  onExecute?: () => void
  className?: string
  showBlochSpheres?: boolean
  showProbabilities?: boolean
  realTimeExecution?: boolean
}

// --- UTILITY FUNCTIONS ---
const gateColors = {
  H: '#3b82f6',      // Blue
  X: '#ef4444',      // Red
  Y: '#f59e0b',      // Amber
  Z: '#10b981',      // Emerald
  CNOT: '#8b5cf6',   // Purple
  RX: '#f97316',     // Orange
  RY: '#84cc16',     // Lime
  RZ: '#06b6d4',     // Cyan
  Toffoli: '#ec4899', // Pink
  Measure: '#6b7280' // Gray
}

const gateDescriptions = {
  H: 'Hadamard Gate - Creates superposition',
  X: 'Pauli-X Gate - Quantum NOT gate',
  Y: 'Pauli-Y Gate - Rotation around Y-axis',
  Z: 'Pauli-Z Gate - Phase flip',
  CNOT: 'Controlled-NOT - Entanglement gate',
  RX: 'Rotation around X-axis',
  RY: 'Rotation around Y-axis', 
  RZ: 'Rotation around Z-axis',
  Toffoli: 'Three-qubit controlled gate',
  Measure: 'Measurement in computational basis'
}

// --- COMPONENTS ---

// Bloch Sphere Visualization
function BlochSphere({ qubitIndex, state, className }: { 
  qubitIndex: number, 
  state?: QuantumState, 
  className?: string 
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const size = 100
    const center = size / 2
    const radius = 40
    
    // Clear canvas
    ctx.clearRect(0, 0, size, size)
    
    // Draw sphere outline
    ctx.strokeStyle = '#4b5563'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, 2 * Math.PI)
    ctx.stroke()
    
    // Draw axes
    ctx.strokeStyle = '#6b7280'
    ctx.lineWidth = 1
    // X axis
    ctx.beginPath()
    ctx.moveTo(center - radius, center)
    ctx.lineTo(center + radius, center)
    ctx.stroke()
    // Y axis
    ctx.beginPath()
    ctx.moveTo(center, center - radius)
    ctx.lineTo(center, center + radius)
    ctx.stroke()
    
    // Draw state vector (simplified representation)
    if (state && state.amplitudes[qubitIndex]) {
      const amp = state.amplitudes[qubitIndex]
      const prob = Math.sqrt(amp.real * amp.real + amp.imaginary * amp.imaginary)
      const phase = Math.atan2(amp.imaginary, amp.real)
      
      // Map quantum state to Bloch sphere coordinates
      const x = center + Math.cos(phase) * prob * radius * 0.8
      const y = center - Math.sin(phase) * prob * radius * 0.8
      
      // Draw state vector
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(center, center)
      ctx.lineTo(x, y)
      ctx.stroke()
      
      // Draw state point
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.arc(x, y, 4, 0, 2 * Math.PI)
      ctx.fill()
    }
    
    // Labels
    ctx.fillStyle = '#9ca3af'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('|0⟩', center, center - radius - 10)
    ctx.fillText('|1⟩', center, center + radius + 15)
    ctx.fillText('|+⟩', center + radius + 10, center + 3)
    ctx.fillText('|-⟩', center - radius - 10, center + 3)
    
  }, [state, qubitIndex])
  
  return (
    <div className={cn("bg-gray-800 rounded-lg p-3", className)}>
      <div className="text-center mb-2">
        <span className="text-sm font-medium text-gray-300">Qubit {qubitIndex}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={100}
        height={100}
        className="mx-auto"
      />
      {state && (
        <div className="mt-2 text-xs text-gray-400 text-center">
          P(|0⟩) = {(state.probabilities[qubitIndex * 2] || 0).toFixed(3)}
        </div>
      )}
    </div>
  )
}

// Gate Component
function QuantumGateComponent({ 
  gate, 
  isActive, 
  onClick, 
  onRemove 
}: { 
  gate: QuantumGate, 
  isActive?: boolean, 
  onClick?: () => void,
  onRemove?: () => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  return (
    <motion.div
      className={cn(
        "relative cursor-pointer select-none",
        isActive && "z-10"
      )}
      style={{
        position: 'absolute',
        left: gate.position.x,
        top: gate.position.y
      }}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className={cn(
          "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-white font-bold text-sm",
          "shadow-lg transition-all duration-200",
          isActive && "ring-2 ring-yellow-400 ring-opacity-60"
        )}
        style={{
          backgroundColor: gateColors[gate.type],
          borderColor: isActive ? '#fbbf24' : 'transparent'
        }}
        animate={isActive ? {
          boxShadow: ['0 0 0 0 rgba(251, 191, 36, 0.7)', '0 0 0 10px rgba(251, 191, 36, 0)'],
        } : {}}
        transition={{ duration: 1, repeat: isActive ? Infinity : 0 }}
      >
        {gate.type}
      </motion.div>
      
      {/* Connection lines for multi-qubit gates */}
      {gate.qubits.length > 1 && (
        <div className="absolute top-6 left-6 w-0.5 bg-gray-400" style={{
          height: (gate.qubits[gate.qubits.length - 1] - gate.qubits[0]) * 60
        }} />
      )}
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 z-20"
          >
            <div className="bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap">
              {gateDescriptions[gate.type]}
              {gate.parameters && (
                <div className="text-gray-300">
                  θ = {gate.parameters[0]?.toFixed(2)}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Remove button */}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
        >
          ×
        </button>
      )}
    </motion.div>
  )
}

// Circuit Grid
function CircuitGrid({ 
  numQubits, 
  circuit, 
  onGateClick, 
  onGateRemove, 
  activeGateId 
}: {
  numQubits: number,
  circuit: QuantumGate[],
  onGateClick?: (gate: QuantumGate) => void,
  onGateRemove?: (gateId: string) => void,
  activeGateId?: string
}) {
  const gridHeight = numQubits * 60
  const gridWidth = 800
  
  return (
    <div className="relative bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
      <svg 
        width={gridWidth} 
        height={gridHeight}
        className="absolute inset-0"
      >
        {/* Qubit lines */}
        {Array.from({ length: numQubits }, (_, i) => (
          <g key={i}>
            <line
              x1={0}
              y1={i * 60 + 30}
              x2={gridWidth}
              y2={i * 60 + 30}
              stroke="#4b5563"
              strokeWidth="2"
            />
            <text
              x={10}
              y={i * 60 + 35}
              fill="#9ca3af"
              fontSize="12"
              className="font-mono"
            >
              |q{i}⟩
            </text>
          </g>
        ))}
        
        {/* Grid lines */}
        {Array.from({ length: Math.floor(gridWidth / 60) }, (_, i) => (
          <line
            key={i}
            x1={i * 60 + 60}
            y1={0}
            x2={i * 60 + 60}
            y2={gridHeight}
            stroke="#374151"
            strokeWidth="1"
            strokeDasharray="5,5"
          />
        ))}
      </svg>
      
      {/* Gates */}
      <div className="relative" style={{ width: gridWidth, height: gridHeight }}>
        {circuit.map((gate) => (
          <QuantumGateComponent
            key={gate.id}
            gate={gate}
            isActive={gate.id === activeGateId}
            onClick={() => onGateClick?.(gate)}
            onRemove={() => onGateRemove?.(gate.id)}
          />
        ))}
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---
export function CircuitVisualizer({
  circuit = [],
  numQubits = 4,
  isExecuting = false,
  onGateAdd,
  onGateRemove,
  onExecute,
  className,
  showBlochSpheres = true,
  showProbabilities = true,
  realTimeExecution = false
}: CircuitVisualizerProps) {
  const [activeGateId, setActiveGateId] = useState<string | null>(null)
  const [selectedGateType, setSelectedGateType] = useState<QuantumGate['type']>('H')
  const [quantumState, setQuantumState] = useState<QuantumState>({
    amplitudes: Array.from({ length: Math.pow(2, numQubits) }, (_, i) => 
      i === 0 ? { real: 1, imaginary: 0 } : { real: 0, imaginary: 0 }
    ),
    probabilities: Array.from({ length: Math.pow(2, numQubits) }, (_, i) => i === 0 ? 1 : 0),
    entanglement: 0,
    coherence: 1
  })
  const [executionStep, setExecutionStep] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  // Gate palette
  const gateTypes: QuantumGate['type'][] = ['H', 'X', 'Y', 'Z', 'CNOT', 'RX', 'RY', 'RZ', 'Measure']

  // Simulate quantum state evolution
  const simulateCircuit = useMemo(() => {
    // This is a simplified quantum circuit simulation
    // In reality, this would use proper quantum state vector computations
    const newState = { ...quantumState }
    
    // Apply each gate's effect on the quantum state
    circuit.forEach((gate, index) => {
      if (index < executionStep) {
        // Simplified gate effects
        switch (gate.type) {
          case 'H':
            // Hadamard creates superposition
            newState.coherence = Math.max(0.5, newState.coherence - 0.1)
            break
          case 'CNOT':
            // CNOT creates entanglement
            newState.entanglement = Math.min(1, newState.entanglement + 0.3)
            break
          case 'X':
          case 'Y':
          case 'Z':
            // Pauli gates affect individual qubits
            newState.coherence = Math.max(0.1, newState.coherence - 0.05)
            break
        }
      }
    })
    
    return newState
  }, [circuit, executionStep, quantumState])

  // Auto-execute circuit
  useEffect(() => {
    if (isPlaying && executionStep < circuit.length) {
      const timer = setTimeout(() => {
        setExecutionStep(prev => prev + 1)
        setQuantumState(simulateCircuit)
      }, 1000)
      return () => clearTimeout(timer)
    } else if (executionStep >= circuit.length) {
      setIsPlaying(false)
    }
  }, [isPlaying, executionStep, circuit.length, simulateCircuit])

  const handleGateClick = (gate: QuantumGate) => {
    setActiveGateId(gate.id === activeGateId ? null : gate.id)
  }

  const handleExecute = () => {
    setIsPlaying(!isPlaying)
    if (executionStep >= circuit.length) {
      setExecutionStep(0)
    }
    onExecute?.()
  }

  const handleReset = () => {
    setIsPlaying(false)
    setExecutionStep(0)
    setActiveGateId(null)
    setQuantumState({
      amplitudes: Array.from({ length: Math.pow(2, numQubits) }, (_, i) => 
        i === 0 ? { real: 1, imaginary: 0 } : { real: 0, imaginary: 0 }
      ),
      probabilities: Array.from({ length: Math.pow(2, numQubits) }, (_, i) => i === 0 ? 1 : 0),
      entanglement: 0,
      coherence: 1
    })
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Quantum Circuit Builder</h2>
          <p className="text-gray-400">Design and simulate quantum circuits for fire prediction</p>
        </div>
        
        <div className="flex items-center gap-3">
          <motion.button
            onClick={handleExecute}
            disabled={circuit.length === 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              circuit.length === 0 
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 text-white"
            )}
            whileHover={{ scale: circuit.length > 0 ? 1.05 : 1 }}
            whileTap={{ scale: circuit.length > 0 ? 0.95 : 1 }}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Execute'}
          </motion.button>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Gate Palette */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Gate Palette</h3>
        <div className="flex flex-wrap gap-3">
          {gateTypes.map((gateType) => (
            <motion.button
              key={gateType}
              onClick={() => setSelectedGateType(gateType)}
              className={cn(
                "w-12 h-12 rounded-lg border-2 flex items-center justify-center text-white font-bold text-sm",
                "shadow-lg transition-all duration-200",
                selectedGateType === gateType ? "ring-2 ring-yellow-400" : ""
              )}
              style={{
                backgroundColor: gateColors[gateType],
                borderColor: selectedGateType === gateType ? '#fbbf24' : 'transparent'
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {gateType}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Circuit */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Circuit Design</h3>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-400" />
              <span className="text-gray-300">
                Step {executionStep}/{circuit.length}
              </span>
            </div>
            {isExecuting && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                <span className="text-purple-300">Executing</span>
              </div>
            )}
          </div>
        </div>
        
        <CircuitGrid
          numQubits={numQubits}
          circuit={circuit}
          onGateClick={handleGateClick}
          onGateRemove={onGateRemove}
          activeGateId={activeGateId || undefined}
        />
      </div>

      {/* Quantum State Visualization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bloch Spheres */}
        {showBlochSpheres && (
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-400" />
              Qubit States
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: Math.min(4, numQubits) }, (_, i) => (
                <BlochSphere
                  key={i}
                  qubitIndex={i}
                  state={quantumState}
                />
              ))}
            </div>
          </div>
        )}

        {/* Quantum Metrics */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-purple-400" />
            Quantum Metrics
          </h3>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-sm">Quantum Coherence</span>
                <span className="text-white font-mono">{(quantumState.coherence * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-blue-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${quantumState.coherence * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-300 text-sm">Entanglement</span>
                <span className="text-white font-mono">{(quantumState.entanglement * 100).toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <motion.div
                  className="bg-purple-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${quantumState.entanglement * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-700">
              <div className="text-xs text-gray-400 space-y-1">
                <div>Gates: {circuit.length}</div>
                <div>Depth: {Math.max(1, Math.ceil(circuit.length / numQubits))}</div>
                <div>Qubits: {numQubits}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Probability Distribution */}
      {showProbabilities && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-green-400" />
            State Probability Distribution
          </h3>
          
          <div className="grid grid-cols-4 gap-2">
            {quantumState.probabilities.slice(0, 8).map((prob, i) => (
              <div key={i} className="text-center">
                <div className="text-xs text-gray-400 mb-1">
                  |{i.toString(2).padStart(numQubits, '0')}⟩
                </div>
                <div className="bg-gray-700 rounded h-16 flex items-end overflow-hidden">
                  <motion.div
                    className="bg-green-500 w-full rounded-t"
                    initial={{ height: 0 }}
                    animate={{ height: `${prob * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                <div className="text-xs text-white mt-1 font-mono">
                  {(prob * 100).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}