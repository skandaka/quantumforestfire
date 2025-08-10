'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  Bar,
  BarChart,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BrainCircuit,
  Cpu,
  Database,
  GitBranch,
  Layers,
  Puzzle,
  Zap,
  CheckCircle,
  FileCode,
  Sigma,
} from 'lucide-react'
import { useQuantumPrediction } from '@/hooks/useQuantumPrediction'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'

// --- CONSTANTS AND CONFIGURATION ---

const quantumConcepts = [
  {
    icon: <Layers className="h-8 w-8 text-cyan-400" />,
    title: 'Superposition',
    description:
        'Quantum bits (qubits) can exist in a combination of both 0 and 1 states simultaneously. This allows a quantum computer to explore a vast number of possibilities at once, making it ideal for modeling the chaotic and multi-pathed nature of fire spread.',
  },
  {
    icon: <GitBranch className="h-8 w-8 text-purple-400" />,
    title: 'Entanglement',
    description:
        "Two or more qubits can become 'entangled,' meaning their fates are linked, no matter the distance separating them. We use entanglement to model the complex correlations between environmental factors like wind, humidity, and fuel type, creating a more holistic and accurate simulation.",
  },
  {
    icon: <Puzzle className="h-8 w-8 text-green-400" />,
    title: 'Classiq Synthesis Engine',
    description:
        'Instead of building circuits gate-by-gate, we define the high-level quantum logic required for fire simulation. The Classiq engine then automatically synthesizes the most optimal, hardware-aware quantum circuit to solve the problem, saving immense development time and improving performance.',
  },
]

const workflowSteps = [
  {
    icon: <FileCode />,
    title: "Define Model",
    description: "A high-level functional model of the fire simulation is defined in Python."
  },
  {
    icon: <BrainCircuit />,
    title: "Quantum Synthesis",
    description: "Classiq's engine converts the model into an optimized quantum circuit."
  },
  {
    icon: <Cpu />,
    title: "Hardware Execution",
    description: "The circuit is run on a simulator or real quantum hardware."
  },
  {
    icon: <Sigma />,
    title: "Analysis & Output",
    description: "Results are processed into a classical fire probability map."
  }
]

// Sample fallback metrics to showcase page when no live prediction has been run yet
const sampleQuantumMetrics: any = {
  synthesis: {
    provider: 'Classiq',
    qubit_count: 24,
    depth: 412,
    gate_count: 6832,
    synthesis_time: 1.287,
  },
  execution: {
    provider: 'IonQ (sim)',
    shots: 4096,
    execution_time: 2.941,
    result_confidence: 0.9342,
  },
  distribution: {
    '000000': 0.072,
    '010101': 0.061,
    '111000': 0.055,
    '001111': 0.052,
    '110011': 0.049,
    '101010': 0.046,
    '011110': 0.041,
    '111111': 0.039,
    '000111': 0.036,
    '100100': 0.034,
  },
  synthesis_modules: [
    { name: 'Ignition Kernel', role: 'Initialization of spatial ignition probabilities', impact: 'Defines base probability amplitude distribution.' },
    { name: 'Wind Coupling', role: 'Applies anisotropic phase shifts', impact: 'Biases spread direction according to wind vectors.' },
    { name: 'Fuel Superposition', role: 'Encodes heterogeneous fuel moisture / load', impact: 'Refines transition amplitudes cell-by-cell.' },
    { name: 'Adaptive Entangler', role: 'Generates correlation lattice', impact: 'Captures multi-cell co-burning dynamics.' },
    { name: 'Noise Mitigation Layer', role: 'Lightweight error suppression transforms', impact: 'Stabilizes high-depth segments.' },
  ],
  hardware_abstraction: [
    { layer: 'High-Level Model', detail: 'Pythonic fire spread functional specification (no gates).', icon: <FileCode className="h-5 w-5 text-cyan-400" /> },
    { layer: 'Classiq Synthesis', detail: 'Constraint-driven circuit generation & resource optimization.', icon: <BrainCircuit className="h-5 w-5 text-purple-400" /> },
    { layer: 'Intermediate Quantum IR', detail: 'Architecture-aware layout, depth balancing & gate fusion.', icon: <Layers className="h-5 w-5 text-indigo-400" /> },
    { layer: 'Provider Backend', detail: 'Target-specific transpilation (basis gates, scheduling).', icon: <Cpu className="h-5 w-5 text-pink-400" /> },
    { layer: 'Execution & Readout', detail: 'Shot execution, measurement aggregation, classical post-process.', icon: <Database className="h-5 w-5 text-emerald-400" /> },
  ]
}

/**
 * A dedicated page to showcase the quantum technology, powered by Classiq,
 * that drives the fire prediction engine.
 */
export default function ClassiqPage() {
  // --- HOOKS ---
  const { currentPrediction } = useQuantumPrediction()
  const quantumMetrics = currentPrediction?.quantumMetrics
  const [useSample, setUseSample] = React.useState(false)
  const effectiveMetrics: any = quantumMetrics || (useSample ? sampleQuantumMetrics : null)

  // --- DERIVED DATA & MEMOIZATION ---
  const distributionData = React.useMemo(() => {
    if (!effectiveMetrics?.distribution) return [] as { name: string; probability: number }[]
    return (Object.entries(effectiveMetrics.distribution) as [string, number][])
      .map(([name, probability]) => ({
        name: name.length > 8 ? `...${name.slice(-6)}` : name,
        probability: Number(probability),
      }))
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 8)
  }, [effectiveMetrics])

  const radarChartData = React.useMemo(() => {
    if (!effectiveMetrics?.synthesis) return []
    const { qubit_count, depth, gate_count } = effectiveMetrics.synthesis
    // Normalize data for radar chart visualization
    const maxQubits = 64
    const maxDepth = 1000
    const maxGates = 20000

    return [
      {
        subject: 'Qubits',
        A: (qubit_count / maxQubits) * 100,
        fullMark: 100,
      },
      { subject: 'Depth', A: (depth / maxDepth) * 100, fullMark: 100 },
      {
        subject: 'Gate Count',
        A: (gate_count / maxGates) * 100,
        fullMark: 100,
      },
    ]
  }, [effectiveMetrics])

  // --- RENDER HELPER COMPONENTS ---

  const renderMetricsPanel = () => {
    if (!effectiveMetrics) {
      return (
          <div className="text-center py-10 bg-gray-800/30 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-300">
              No Quantum Data Available
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Run a prediction on the dashboard to see live quantum metrics.
            </p>
            <Link href="/dashboard">
              <Button className="mt-4" size="sm">
                Go to Dashboard
              </Button>
            </Link>
            <div className="mt-6">
              <Button variant="outline" size="sm" onClick={() => setUseSample(true)}>
                Load Sample Quantum Run
              </Button>
            </div>
          </div>
      )
    }

    const { synthesis, execution } = effectiveMetrics
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Synthesis Metrics */}
          <div className="bg-gray-800/50 border border-gray-700/80 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <BrainCircuit className="h-6 w-6 text-cyan-400" />
              Circuit Synthesis Metrics
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Provider:</span>
                <span className="font-mono bg-cyan-900/50 text-cyan-300 px-2 py-0.5 rounded">
                {synthesis.provider}
              </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Qubit Count:</span>
                <span className="font-bold">{synthesis.qubit_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Circuit Depth:</span>
                <span className="font-bold">{synthesis.depth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Gate Count:</span>
                <span className="font-bold">
                {synthesis.gate_count.toLocaleString()}
              </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Synthesis Time:</span>
                <span className="font-bold">
                {synthesis.synthesis_time.toFixed(3)}s
              </span>
              </div>
            </div>
          </div>

          {/* Execution Metrics */}
          <div className="bg-gray-800/50 border border-gray-700/80 rounded-lg p-6">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Cpu className="h-6 w-6 text-purple-400" />
              Hardware Execution Metrics
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Execution Provider:</span>
                <span className="font-mono bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">
                {execution.provider}
              </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shots:</span>
                <span className="font-bold">{execution.shots.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Execution Time:</span>
                <span className="font-bold">
                {execution.execution_time.toFixed(3)}s
              </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Result Confidence:</span>
                <span className="font-bold text-green-400">
                {(execution.result_confidence * 100).toFixed(2)}%
              </span>
              </div>
            </div>
          </div>
        </div>
    )
  }

  const renderVisualizations = () => (
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Probability Distribution Chart */}
        <div className="lg:col-span-3 bg-gray-800/50 border border-gray-700/80 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">
            Quantum State Probability Distribution
          </h3>
          {distributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={distributionData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis
                      type="category"
                      dataKey="name"
                      stroke="#a0aec0"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                  />
                  <Tooltip
                      cursor={{ fill: 'rgba(255, 255, 255, 0.1)' }}
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: '#4a5568',
                      }}
                  />
                  <Legend />
                  <Bar
                      dataKey="probability"
                      fill="url(#colorUv)"
                      radius={[0, 4, 4, 0]}
                      background={{ fill: '#ffffff08', radius: 4 }}
                  />
                </BarChart>
              </ResponsiveContainer>
          ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No distribution data to display.
              </div>
          )}
        </div>

        {/* Radar Chart */}
        <div className="lg:col-span-2 bg-gray-800/50 border border-gray-700/80 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Circuit Complexity Profile</h3>
          {radarChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart
                    cx="50%"
                    cy="50%"
                    outerRadius="80%"
                    data={radarChartData}
                >
                  <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                  <PolarGrid stroke="#4a5568" />
                  <PolarAngleAxis dataKey="subject" stroke="#a0aec0" />
                  <Radar
                      name="Complexity"
                      dataKey="A"
                      stroke="#8884d8"
                      fill="url(#radarGradient)"
                      fillOpacity={0.6}
                  />
                  <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.9)',
                        borderColor: '#4a5568',
                      }}
                  />
                </RadarChart>
              </ResponsiveContainer>
          ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                No complexity data to display.
              </div>
          )}
        </div>
      </div>
  )


  // --- MAIN RENDER ---
  return (
      <div className="min-h-screen bg-black text-white py-24 px-4 sm:px-6 lg:px-8">
        {/* For Bar Chart Gradient */}
        <svg width="0" height="0">
          <defs>
            <linearGradient id="colorUv" x1="0" y1="0" x2="1" y2="0">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.9} />
            </linearGradient>
          </defs>
        </svg>

        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Quantum Technology Core
            </span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto">
              A look under the hood at the quantum circuits and algorithms,
              powered by Classiq, that make our fire predictions possible.
            </p>
          </motion.div>

          {/* Live Metrics Section */}
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-16"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">
              Live Prediction Analysis
            </h2>
            {renderMetricsPanel()}
              {useSample && !quantumMetrics && (
                <p className="mt-4 text-center text-xs text-gray-500">Showing sample synthesized metrics. Run a real prediction to replace this.</p>
              )}
          </motion.div>

          {/* Visualization Section */}
          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="mb-20"
          >
            <h2 className="text-3xl font-bold mb-6 text-center">
              Data Visualization
            </h2>
            {renderVisualizations()}
          </motion.div>

          {/* Quantum Concepts Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-10 text-center">
              Core Quantum Concepts
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              {quantumConcepts.map((concept, i) => (
                  <motion.div
                      key={concept.title}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.1 }}
                      viewport={{ once: true }}
                      className="bg-gray-900/50 p-6 rounded-lg border border-gray-800/80"
                  >
                    <div className="mb-4">{concept.icon}</div>
                    <h3 className="text-xl font-bold mb-2">{concept.title}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      {concept.description}
                    </p>
                  </motion.div>
              ))}
            </div>
          </div>

          {/* Workflow Section */}
          <div>
            <h2 className="text-3xl font-bold mb-10 text-center">Our Quantum Workflow</h2>
            <div className="relative">
              {/* Connecting line */}
              <div className="absolute left-1/2 top-5 h-full w-0.5 bg-gray-700/50 hidden md:block" />
              <div className="grid md:grid-cols-4 gap-8">
                {workflowSteps.map((step, i) => (
                    <motion.div
                        key={step.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.15 }}
                        viewport={{ once: true }}
                        className="text-center flex flex-col items-center"
                    >
                      <div className="bg-gray-800 border-2 border-gray-700 rounded-full h-16 w-16 flex items-center justify-center z-10">
                        {step.icon}
                      </div>
                      <h3 className="mt-4 font-bold text-lg">{step.title}</h3>
                      <p className="mt-1 text-xs text-gray-400 max-w-xs mx-auto">{step.description}</p>
                    </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Algorithm Modules Section */}
          {effectiveMetrics && (
            <div className="mt-24 mb-16">
              <h2 className="text-3xl font-bold mb-10 text-center">Circuit Module Composition</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {effectiveMetrics.synthesis_modules?.map((m: any) => (
                  <div key={m.name} className="bg-gray-900/50 p-5 rounded-lg border border-gray-800/70 flex flex-col">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-amber-400" />
                      <h3 className="font-semibold text-sm tracking-wide uppercase">{m.name}</h3>
                    </div>
                    <p className="text-gray-400 text-xs mb-2">{m.role}</p>
                    <p className="text-emerald-300 text-xs font-mono">{m.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hardware Abstraction Layer Section */}
          {effectiveMetrics && (
            <div className="mt-20 mb-10">
              <h2 className="text-3xl font-bold mb-10 text-center">Hardware Abstraction Layers</h2>
              <div className="space-y-4 max-w-4xl mx-auto">
                {effectiveMetrics.hardware_abstraction?.map((h: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-4 bg-gray-900/40 p-4 rounded-lg border border-gray-800/60">
                    <div className="mt-1">{h.icon}</div>
                    <div>
                      <h4 className="font-semibold text-sm tracking-wide text-gray-200">{h.layer}</h4>
                      <p className="text-gray-400 text-xs leading-relaxed">{h.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
  )
}