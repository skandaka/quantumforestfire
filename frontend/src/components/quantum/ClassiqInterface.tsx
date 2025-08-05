'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  Download, 
  Upload, 
  Code, 
  Cpu, 
  Zap, 
  CheckCircle, 
  AlertTriangle, 
  Info,
  RefreshCw,
  Settings,
  Cloud,
  Monitor,
  FileText,
  Copy,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface ClassiqJob {
  id: string
  name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
  created: Date
  duration?: number
  qubits: number
  depth: number
  shots: number
  backend: string
  result?: ClassiqResult
}

interface ClassiqResult {
  counts: Record<string, number>
  probabilities: Record<string, number>
  executionTime: number
  quantumVolume: number
  fidelity: number
}

interface ClassiqCircuit {
  id: string
  name: string
  qasm: string
  description: string
  created: Date
  qubits: number
  depth: number
  gates: number
}

interface ClassiqInterfaceProps {
  className?: string
  onCircuitLoad?: (circuit: ClassiqCircuit) => void
  onJobComplete?: (job: ClassiqJob) => void
}

// --- MOCK DATA ---
const mockJobs: ClassiqJob[] = [
  {
    id: 'job_001',
    name: 'Fire Prediction Circuit',
    status: 'completed',
    created: new Date(Date.now() - 3600000),
    duration: 45.3,
    qubits: 8,
    depth: 12,
    shots: 1000,
    backend: 'classiq_simulator',
    result: {
      counts: { '00000000': 234, '11111111': 201, '10101010': 156, '01010101': 143 },
      probabilities: { '00000000': 0.234, '11111111': 0.201, '10101010': 0.156, '01010101': 0.143 },
      executionTime: 45.3,
      quantumVolume: 64,
      fidelity: 0.94
    }
  },
  {
    id: 'job_002',
    name: 'Weather Pattern Analysis',
    status: 'running',
    created: new Date(Date.now() - 1800000),
    qubits: 12,
    depth: 18,
    shots: 2000,
    backend: 'classiq_hardware'
  },
  {
    id: 'job_003',
    name: 'Terrain Mapping',
    status: 'pending',
    created: new Date(Date.now() - 900000),
    qubits: 6,
    depth: 8,
    shots: 500,
    backend: 'classiq_simulator'
  }
]

const mockCircuits: ClassiqCircuit[] = [
  {
    id: 'circuit_001',
    name: 'Fire Risk Classifier',
    qasm: `OPENQASM 2.0;
include "qelib1.inc";
qreg q[4];
creg c[4];
h q[0];
cx q[0],q[1];
ry(0.785) q[2];
cx q[1],q[3];
measure q -> c;`,
    description: 'Quantum circuit for fire risk classification using superposition and entanglement',
    created: new Date(Date.now() - 86400000),
    qubits: 4,
    depth: 5,
    gates: 6
  },
  {
    id: 'circuit_002',
    name: 'Weather Correlation Model',
    qasm: `OPENQASM 2.0;
include "qelib1.inc";
qreg q[6];
creg c[6];
h q[0];
h q[1];
cx q[0],q[2];
cx q[1],q[3];
ry(1.571) q[4];
cx q[2],q[5];
measure q -> c;`,
    description: 'Multi-variable weather pattern correlation analysis',
    created: new Date(Date.now() - 172800000),
    qubits: 6,
    depth: 6,
    gates: 8
  }
]

// --- COMPONENTS ---

// Job Status Badge
function JobStatusBadge({ status }: { status: ClassiqJob['status'] }) {
  const configs = {
    pending: { color: 'bg-yellow-500', icon: AlertTriangle, text: 'Pending' },
    running: { color: 'bg-blue-500 animate-pulse', icon: Play, text: 'Running' },
    completed: { color: 'bg-green-500', icon: CheckCircle, text: 'Completed' },
    failed: { color: 'bg-red-500', icon: AlertTriangle, text: 'Failed' },
    cancelled: { color: 'bg-gray-500', icon: Pause, text: 'Cancelled' }
  }
  
  const config = configs[status]
  const Icon = config.icon
  
  return (
    <div className={cn("flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium text-white", config.color)}>
      <Icon className="w-3 h-3" />
      {config.text}
    </div>
  )
}

// Circuit Card
function CircuitCard({ 
  circuit, 
  onLoad, 
  onView 
}: { 
  circuit: ClassiqCircuit, 
  onLoad?: (circuit: ClassiqCircuit) => void,
  onView?: (circuit: ClassiqCircuit) => void
}) {
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-purple-500 transition-colors"
      whileHover={{ scale: 1.02 }}
      layout
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{circuit.name}</h3>
          <p className="text-sm text-gray-400 mt-1">{circuit.description}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onView?.(circuit)}
            className="p-1.5 text-gray-400 hover:text-blue-400 transition-colors"
            title="View Circuit"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            onClick={() => onLoad?.(circuit)}
            className="p-1.5 text-gray-400 hover:text-green-400 transition-colors"
            title="Load Circuit"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-400">Qubits</span>
          <div className="font-medium text-white">{circuit.qubits}</div>
        </div>
        <div>
          <span className="text-gray-400">Depth</span>
          <div className="font-medium text-white">{circuit.depth}</div>
        </div>
        <div>
          <span className="text-gray-400">Gates</span>
          <div className="font-medium text-white">{circuit.gates}</div>
        </div>
      </div>
      
      <div className="mt-3 pt-3 border-t border-gray-700">
        <span className="text-xs text-gray-500">
          Created {circuit.created.toLocaleDateString()}
        </span>
      </div>
    </motion.div>
  )
}

// Job Card
function JobCard({ job }: { job: ClassiqJob }) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-'
    return `${seconds.toFixed(1)}s`
  }
  
  return (
    <motion.div
      className="bg-gray-800 rounded-lg p-4 border border-gray-700"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{job.name}</h3>
          <p className="text-sm text-gray-400">Job ID: {job.id}</p>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm mb-3">
        <div>
          <span className="text-gray-400">Qubits</span>
          <div className="font-medium text-white">{job.qubits}</div>
        </div>
        <div>
          <span className="text-gray-400">Depth</span>
          <div className="font-medium text-white">{job.depth}</div>
        </div>
        <div>
          <span className="text-gray-400">Shots</span>
          <div className="font-medium text-white">{job.shots.toLocaleString()}</div>
        </div>
        <div>
          <span className="text-gray-400">Duration</span>
          <div className="font-medium text-white">{formatDuration(job.duration)}</div>
        </div>
      </div>
      
      {job.result && (
        <div className="mt-4 p-3 bg-gray-900 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="font-medium text-green-400">Execution Complete</span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <span className="text-gray-400">Fidelity</span>
              <div className="font-medium text-white">{(job.result.fidelity * 100).toFixed(1)}%</div>
            </div>
            <div>
              <span className="text-gray-400">Quantum Volume</span>
              <div className="font-medium text-white">{job.result.quantumVolume}</div>
            </div>
            <div>
              <span className="text-gray-400">States</span>
              <div className="font-medium text-white">{Object.keys(job.result.counts).length}</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-3 pt-3 border-t border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {job.created.toLocaleString()}
        </span>
        <div className="flex items-center gap-1">
          <Monitor className="w-3 h-3 text-gray-400" />
          <span className="text-xs text-gray-400">{job.backend}</span>
        </div>
      </div>
    </motion.div>
  )
}

// Code Viewer Modal
function CodeViewerModal({ 
  circuit, 
  isOpen, 
  onClose 
}: { 
  circuit?: ClassiqCircuit, 
  isOpen: boolean, 
  onClose: () => void 
}) {
  const codeRef = useRef<HTMLPreElement>(null)
  
  const copyToClipboard = () => {
    if (circuit?.qasm && navigator.clipboard) {
      navigator.clipboard.writeText(circuit.qasm)
    }
  }
  
  return (
    <AnimatePresence>
      {isOpen && circuit && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <div>
                <h2 className="text-lg font-semibold text-white">{circuit.name}</h2>
                <p className="text-sm text-gray-400">QASM Code</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
            
            <div className="p-4 overflow-auto max-h-96">
              <pre
                ref={codeRef}
                className="text-sm text-gray-300 bg-gray-800 p-4 rounded-lg font-mono overflow-x-auto"
              >
                {circuit.qasm}
              </pre>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// --- MAIN COMPONENT ---
export function ClassiqInterface({
  className,
  onCircuitLoad,
  onJobComplete
}: ClassiqInterfaceProps) {
  const [activeTab, setActiveTab] = useState<'circuits' | 'jobs' | 'results'>('circuits')
  const [jobs, setJobs] = useState<ClassiqJob[]>(mockJobs)
  const [selectedCircuit, setSelectedCircuit] = useState<ClassiqCircuit | null>(null)
  const [showCodeViewer, setShowCodeViewer] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  
  // Simulate job updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJobs(prevJobs => 
        prevJobs.map(job => {
          if (job.status === 'running') {
            // 30% chance to complete running jobs
            if (Math.random() < 0.3) {
              const completedJob = {
                ...job,
                status: 'completed' as const,
                duration: Math.random() * 120 + 30,
                result: {
                  counts: { '00000000': 234, '11111111': 201, '10101010': 156, '01010101': 143 },
                  probabilities: { '00000000': 0.234, '11111111': 0.201, '10101010': 0.156, '01010101': 0.143 },
                  executionTime: Math.random() * 120 + 30,
                  quantumVolume: job.qubits * job.qubits,
                  fidelity: 0.9 + Math.random() * 0.1
                }
              }
              onJobComplete?.(completedJob)
              return completedJob
            }
          }
          return job
        })
      )
    }, 5000)
    
    return () => clearInterval(interval)
  }, [onJobComplete])
  
  const handleCircuitLoad = (circuit: ClassiqCircuit) => {
    onCircuitLoad?.(circuit)
  }
  
  const handleCircuitView = (circuit: ClassiqCircuit) => {
    setSelectedCircuit(circuit)
    setShowCodeViewer(true)
  }
  
  const runningJobs = jobs.filter(job => job.status === 'running').length
  const completedJobs = jobs.filter(job => job.status === 'completed').length
  
  return (
    <div className={cn("bg-gray-900 rounded-lg", className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Classiq Platform</h2>
              <p className="text-gray-400">Quantum circuit development and execution</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={cn(
                "w-3 h-3 rounded-full",
                isConnected ? 'bg-green-400' : 'bg-red-400'
              )} />
              <span className="text-sm text-gray-300">
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <button
              onClick={() => setIsConnected(!isConnected)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="Refresh connection"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-400">Circuits</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1">
              {mockCircuits.length}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-400">Running</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1">
              {runningJobs}
            </div>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-sm text-gray-400">Completed</span>
            </div>
            <div className="text-lg font-semibold text-white mt-1">
              {completedJobs}
            </div>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex">
          {[
            { id: 'circuits', label: 'Circuits', icon: Code },
            { id: 'jobs', label: 'Jobs', icon: Cpu },
            { id: 'results', label: 'Results', icon: Zap }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-4 font-medium transition-colors border-b-2",
                activeTab === id
                  ? "text-purple-400 border-purple-400"
                  : "text-gray-400 border-transparent hover:text-gray-300"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="p-6">
        {activeTab === 'circuits' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Saved Circuits</h3>
              <button className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                <Upload className="w-4 h-4" />
                Import Circuit
              </button>
            </div>
            
            <div className="grid gap-4">
              {mockCircuits.map((circuit) => (
                <CircuitCard
                  key={circuit.id}
                  circuit={circuit}
                  onLoad={handleCircuitLoad}
                  onView={handleCircuitView}
                />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'jobs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Execution Jobs</h3>
              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </div>
            </div>
            
            <div className="grid gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          </div>
        )}
        
        {activeTab === 'results' && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Analysis Results</h3>
            
            <div className="grid gap-4">
              {jobs
                .filter(job => job.status === 'completed' && job.result)
                .map((job) => (
                  <div key={job.id} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <h4 className="font-semibold text-white mb-3">{job.name}</h4>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-gray-400 text-sm">Execution Time</span>
                        <div className="font-medium text-white">{job.result?.executionTime.toFixed(1)}s</div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Fidelity</span>
                        <div className="font-medium text-white">{((job.result?.fidelity || 0) * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Quantum Volume</span>
                        <div className="font-medium text-white">{job.result?.quantumVolume}</div>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Unique States</span>
                        <div className="font-medium text-white">{Object.keys(job.result?.counts || {}).length}</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 rounded-lg p-3">
                      <h5 className="text-sm font-medium text-gray-300 mb-2">State Probabilities</h5>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(job.result?.probabilities || {}).slice(0, 4).map(([state, prob]) => (
                          <div key={state} className="flex justify-between">
                            <span className="font-mono text-gray-400">|{state}⟩</span>
                            <span className="text-white">{(prob * 100).toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Code Viewer Modal */}
      <CodeViewerModal
        circuit={selectedCircuit || undefined}
        isOpen={showCodeViewer}
        onClose={() => setShowCodeViewer(false)}
      />
    </div>
  )
}