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
  const { data: statusData } = useQuery({
    queryKey: ['system-status'],
    queryFn: () => api.getSystemStatus(),
    refetchInterval: 30000, // Check every 30 seconds
    onSuccess: (data) => {
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
  const { data: metricsData } = useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => api.getMetrics(),
    refetchInterval: 10000, // Update every 10 seconds
    onSuccess: (data) => {
      setMetrics(data)
    }
  })

  // Run fire prediction
  const runPredictionMutation = useMutation({
    mutationFn: (request: PredictionRequest) => api.runPrediction(request),
    onSuccess: (data: PredictionResponse) => {
      // Store in global state
      setCurrentPrediction(data)
      addPredictionToHistory(data)

      if (data.quantum_metrics) {
        setQuantumMetrics(data.quantum_metrics)
      }

      // Show success notification
      toast.success(`Prediction completed in ${data.metadata.execution_time.toFixed(1)}s`)

      // Invalidate related queries
      queryClient.invalidateQueries(['predictions'])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to run prediction')
    }
  })

  // Run ember prediction
  const runEmberPredictionMutation = useMutation({
    mutationFn: (request: any) => api.runEmberPrediction(request),
    onSuccess: (data) => {
      toast.success('Ember cast prediction completed')

      // Check for Paradise-like warnings
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

  // Get prediction status
  const getPredictionStatus = useCallback(async (predictionId: string) => {
    try {
      const response = await api.getPredictionStatus(predictionId)
      return response.data
    } catch (error) {
      console.error('Failed to get prediction status:', error)
      return null
    }
  }, [])

  // Subscribe to real-time predictions
  useEffect(() => {
    const eventSource = api.subscribeToPredictions({
      latitude: 39.7596, // Default to Paradise
      longitude: -121.6219
    })

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      if (data.type === 'prediction') {
        setCurrentPrediction(data.data)
      }
    }

    eventSource.onerror = () => {
      console.error('Lost connection to prediction stream')
      setSystemStatus('degraded')
    }

    return () => {
      eventSource.close()
    }
  }, [setCurrentPrediction, setSystemStatus])

  return {
    // State
    systemStatus,
    metrics,
    currentPrediction: useFirePredictionStore(state => state.currentPrediction),
    predictionHistory: useFirePredictionStore(state => state.predictionHistory),
    quantumMetrics: useFirePredictionStore(state => state.quantumMetrics),

    // Actions
    runPrediction: runPredictionMutation.mutate,
    runEmberPrediction: runEmberPredictionMutation.mutate,
    getPredictionStatus,

    // Loading states
    isLoading: runPredictionMutation.isLoading || runEmberPredictionMutation.isLoading,
    isRunningPrediction: runPredictionMutation.isLoading,
    isRunningEmberPrediction: runEmberPredictionMutation.isLoading,

    // Error states
    error: runPredictionMutation.error || runEmberPredictionMutation.error
  }
}