import { useState, useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useFirePredictionStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface PredictionRequest {
  location: {
    latitude: number
    longitude: number
  }
  radius: number
  timeHorizon: number
  model: string
  useQuantumHardware?: boolean
  includeEmberAnalysis?: boolean
}

interface PredictionResponse {
  prediction_id: string
  status: string
  timestamp: string
  location: {
    latitude: number
    longitude: number
    radius_km: number
  }
  predictions: Array<{
    time_step: number
    timestamp: string
    fire_probability_map: number[][]
    high_risk_cells: Array<[number, number]>
    total_area_at_risk: number
    ember_landing_map?: number[][]
    ignition_risk_map?: number[][]
  }>
  metadata: {
    model_type: string
    execution_time: number
    quantum_backend: string
    accuracy_estimate: number
  }
  quantum_metrics?: {
    synthesis: {
      depth: number
      gate_count: number
      qubit_count: number
      synthesis_time: number
    }
    execution: {
      total_time: number
      backend: string
    }
  }
  warnings: string[]
}

export function useQuantumPrediction() {
  const queryClient = useQueryClient()
  const {
    setCurrentPrediction,
    addPredictionToHistory,
    setQuantumMetrics
  } = useFirePredictionStore()

  const [systemStatus, setSystemStatus] = useState<'operational' | 'degraded' | 'offline'>('operational')
  const [metrics, setMetrics] = useState<any>(null)

  // Check system status
  useQuery({
    queryKey: ['system-status'],
    queryFn: () => api.getSystemStatus(),
    refetchInterval: 30000,
    onSuccess: (response) => {
      const data = response.data;
      if (data.status === 'healthy') {
        setSystemStatus('operational')
      } else if (data.status === 'degraded') {
        setSystemStatus('degraded')
      } else {
        setSystemStatus('offline')
      }
    },
    onError: () => {
      setSystemStatus('offline')
    }
  })

  // Get system metrics
  useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => api.getMetrics(),
    refetchInterval: 10000,
    onSuccess: (response) => {
      setMetrics(response.data)
    }
  })

  // Run fire prediction
  const runPredictionMutation = useMutation<PredictionResponse, Error, PredictionRequest>({
    mutationFn: async (request: PredictionRequest) => {
      const response = await api.runPrediction(request);
      return response.data;
    },
    onSuccess: (data) => {
      setCurrentPrediction(data)
      addPredictionToHistory(data)
      if (data.quantum_metrics) {
        setQuantumMetrics(data.quantum_metrics)
      }
      toast.success(`Prediction completed in ${data.metadata.execution_time.toFixed(1)}s`)
      queryClient.invalidateQueries({ queryKey: ['predictions'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to run prediction')
    }
  })

  // Run ember prediction
  const runEmberPredictionMutation = useMutation<PredictionResponse, Error, any>({
    mutationFn: async (request: any) => {
        const response = await api.runEmberPrediction(request);
        return response.data;
    },
    onSuccess: (data) => {
      toast.success('Ember cast prediction completed')
      if (data.warnings && data.warnings.length > 0) {
        data.warnings.forEach((warning: string) => {
          toast.error(warning, { duration: 10000 })
        })
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to run ember prediction')
    }
  })

  const getPredictionStatus = useCallback(async (predictionId: string) => {
    try {
      const response = await api.getPredictionStatus(predictionId)
      return response.data
    } catch (error) {
      console.error('Failed to get prediction status:', error)
      return null
    }
  }, [])

  useEffect(() => {
    // This is a placeholder for a real WebSocket/SSE implementation
    // For now, it doesn't do anything to avoid breaking changes
    // A real implementation would connect to the backend's /ws endpoint
    return () => {};
  }, [setCurrentPrediction, setSystemStatus]);

  return {
    systemStatus,
    metrics,
    currentPrediction: useFirePredictionStore(state => state.currentPrediction),
    predictionHistory: useFirePredictionStore(state => state.predictionHistory),
    quantumMetrics: useFirePredictionStore(state => state.quantumMetrics),
    runPrediction: runPredictionMutation.mutate,
    runEmberPrediction: runEmberPredictionMutation.mutate,
    getPredictionStatus,
    isLoading: runPredictionMutation.isPending || runEmberPredictionMutation.isPending,
    isRunningPrediction: runPredictionMutation.isPending,
    isRunningEmberPrediction: runEmberPredictionMutation.isPending,
    error: runPredictionMutation.error || runEmberPredictionMutation.error
  }
}