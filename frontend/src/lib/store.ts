import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface FirePredictionState {
  // Current prediction data
  currentPrediction: any | null
  setCurrentPrediction: (prediction: any) => void

  // Prediction history
  predictionHistory: any[]
  addPredictionToHistory: (prediction: any) => void
  clearPredictionHistory: () => void

  // Fire data
  fireData: any | null
  setFireData: (data: any) => void

  // Weather data
  weatherData: any | null
  setWeatherData: (data: any) => void
  windData: any | null
  setWindData: (data: any) => void

  // Quantum metrics
  quantumMetrics: any | null
  setQuantumMetrics: (metrics: any) => void

  // Active alerts
  activeAlerts: any[]
  addAlert: (alert: any) => void
  removeAlert: (alertId: string) => void
  clearAlerts: () => void

  // UI state
  selectedLocation: { latitude: number; longitude: number } | null
  setSelectedLocation: (location: { latitude: number; longitude: number } | null) => void

  selectedModel: string
  setSelectedModel: (model: string) => void

  timeHorizon: number
  setTimeHorizon: (hours: number) => void

  // Paradise demo state
  paradiseDemoState: any | null
  setParadiseDemoState: (state: any) => void
}

export const useFirePredictionStore = create<FirePredictionState>()(
  devtools(
    persist(
      (set) => ({
        // Current prediction data
        currentPrediction: null,
        setCurrentPrediction: (prediction) => set({ currentPrediction: prediction }),

        // Prediction history
        predictionHistory: [],
        addPredictionToHistory: (prediction) =>
          set((state) => ({
            predictionHistory: [prediction, ...state.predictionHistory].slice(0, 50) // Keep last 50
          })),
        clearPredictionHistory: () => set({ predictionHistory: [] }),

        // Fire data
        fireData: null,
        setFireData: (data) => set({ fireData: data }),

        // Weather data
        weatherData: null,
        setWeatherData: (data) => set({ weatherData: data }),
        windData: null,
        setWindData: (data) => set({ windData: data }),

        // Quantum metrics
        quantumMetrics: null,
        setQuantumMetrics: (metrics) => set({ quantumMetrics: metrics }),

        // Active alerts
        activeAlerts: [],
        addAlert: (alert) =>
          set((state) => ({
            activeAlerts: [alert, ...state.activeAlerts]
          })),
        removeAlert: (alertId) =>
          set((state) => ({
            activeAlerts: state.activeAlerts.filter(a => a.id !== alertId)
          })),
        clearAlerts: () => set({ activeAlerts: [] }),

        // UI state
        selectedLocation: null,
        setSelectedLocation: (location) => set({ selectedLocation: location }),

        selectedModel: 'ensemble',
        setSelectedModel: (model) => set({ selectedModel: model }),

        timeHorizon: 24,
        setTimeHorizon: (hours) => set({ timeHorizon: hours }),

        // Paradise demo state
        paradiseDemoState: null,
        setParadiseDemoState: (state) => set({ paradiseDemoState: state }),
      }),
      {
        name: 'fire-prediction-storage',
        partialize: (state) => ({
          predictionHistory: state.predictionHistory,
          selectedModel: state.selectedModel,
          timeHorizon: state.timeHorizon,
        }),
      }
    )
  )
)