import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useFirePredictionStore } from '@/lib/store'

export function useParadiseFireDemo() {
  const [currentState, setCurrentState] = useState<any>(null)
  const [quantumPrediction, setQuantumPrediction] = useState<any>(null)
  const [classicalPrediction, setClassicalPrediction] = useState<any>(null)

  const { setParadiseDemoState } = useFirePredictionStore()

  const runDemoMutation = useMutation({
    mutationFn: () => api.runParadiseDemo(),
    onSuccess: (response) => {
      const data = response.data
      setCurrentState(data.historical_data)
      setQuantumPrediction(data.quantum_prediction)
      setClassicalPrediction({
        // Mock classical prediction that misses the ember jump
        predictions: [{
          time_step: 0,
          fire_probability_map: data.quantum_prediction?.predictions?.[0]?.fire_probability_map || [],
          high_risk_cells: [],
          total_area_at_risk: 100
        }],
        metadata: {
          model_type: 'classical',
          accuracy_estimate: 0.652
        }
      })
      setParadiseDemoState(data)
    }
  })

  const runDemo = useCallback(() => {
    return runDemoMutation.mutate()
  }, [runDemoMutation])

  return {
    runDemo,
    currentState,
    quantumPrediction,
    classicalPrediction,
    isLoading: runDemoMutation.isLoading,
    error: runDemoMutation.error
  }
}