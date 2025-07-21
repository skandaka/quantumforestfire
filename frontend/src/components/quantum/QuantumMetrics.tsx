import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { Cpu, Zap, BarChart3, Clock } from 'lucide-react'
import { formatNumber, formatPercent } from '@/lib/utils'

export function QuantumMetrics() {
  const { data: quantumStatus } = useQuery({
    queryKey: ['quantum-status'],
    queryFn: () => api.getQuantumStatus(),
    refetchInterval: 30000
  })

  const { data: quantumMetrics } = useQuery({
    queryKey: ['quantum-metrics'],
    queryFn: () => api.getQuantumMetrics(),
    refetchInterval: 10000
  })

  const metrics = quantumMetrics?.data
  const status = quantumStatus?.data

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Quantum System Metrics</h2>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Circuit Depth"
          value={formatNumber(metrics?.quantum?.models?.classiq_fire_spread?.circuit_depth || 0)}
          icon={<Cpu className="h-5 w-5" />}
        />

        <MetricCard
          title="Gate Count"
          value={formatNumber(metrics?.quantum?.models?.classiq_fire_spread?.gate_count || 0)}
          icon={<Zap className="h-5 w-5" />}
        />

        <MetricCard
          title="Quantum Speedup"
          value={`${formatNumber(metrics?.quantum?.quantum_advantage?.speedup_vs_classical || 0)}x`}
          icon={<BarChart3 className="h-5 w-5" />}
          trend="up"
        />

        <MetricCard
          title="Avg Execution Time"
          value={`${formatNumber(metrics?.quantum?.avg_prediction_time || 0, 1)}s`}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>

      {/* Backend Status */}
      {status?.available_backends && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Quantum Backends</h3>
          <div className="space-y-3">
            {status.available_backends.map((backend: any) => (
              <div key={backend.name} className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium">{backend.name}</p>
                  <p className="text-sm text-gray-400">
                    Type: {backend.type} | Max Qubits: {backend.max_qubits}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${
                  backend.status === 'available' 
                    ? 'bg-green-500/20 text-green-400' 
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {backend.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {metrics?.quantum?.models && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Model Performance</h3>
          <div className="space-y-4">
            {Object.entries(metrics.quantum.models).map(([model, data]: [string, any]) => (
              <div key={model} className="border-l-2 border-purple-500 pl-4">
                <h4 className="font-medium">{model.replace(/_/g, ' ').toUpperCase()}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
                  <div>
                    <p className="text-xs text-gray-400">Depth</p>
                    <p className="text-sm font-medium">{data.circuit_depth}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Gates</p>
                    <p className="text-sm font-medium">{data.gate_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Qubits</p>
                    <p className="text-sm font-medium">{data.qubit_count}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Synthesis Time</p>
                    <p className="text-sm font-medium">{data.synthesis_time}s</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}