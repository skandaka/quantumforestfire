import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { useCallback } from 'react'
import { LngLatLike } from 'mapbox-gl'

// --- TYPE DEFINITIONS ---
export interface DemoStageData {
  stage: number
  timestamp: string
  fire_locations: {
    id: string
    latitude: number
    longitude: number
    brightness: number
    confidence: number
  }[]
  ember_prediction_area?: LngLatLike[]
  weather_stations: {
    id: string
    latitude: number
    longitude: number
    wind_speed: number
  }[]
}

interface ParadiseFireDemoState {
  simulationData: DemoStageData | null
  currentStage: number
  status: 'idle' | 'pending' | 'success' | 'error'
  error: string | null
  runStage: (stageIndex: number) => Promise<void>
  reset: () => void
}

const useParadiseFireDemoStore = create<ParadiseFireDemoState>()(
    immer((set) => ({
      simulationData: null,
      currentStage: -1,
      status: 'idle',
      error: null,
      runStage: async (stageIndex: number) => {
        set((state) => {
          state.status = 'pending'
          state.currentStage = stageIndex
          state.error = null
        })
        try {
          const response = await axios.get(`/api/demo/paradise-fire/stage/${stageIndex}`)
          if (!response.data) {
            throw new Error(`No data returned for demo stage ${stageIndex}.`)
          }
          set((state) => {
            state.simulationData = response.data
            state.status = 'success'
          })
        } catch (err) {
          let errorMessage = 'Failed to load simulation data for this stage.'
          if (axios.isAxiosError(err)) {
            // @ts-ignore
            errorMessage = (err as AxiosError).response?.data?.error || err.message
          } else if (err instanceof Error) {
            errorMessage = err.message
          }
          set((state) => {
            state.status = 'error'
            state.error = errorMessage
          })
          throw new Error(errorMessage)
        }
      },
      reset: () => {
        set({
          simulationData: null,
          currentStage: -1,
          status: 'idle',
          error: null,
        })
      },
    }))
)

export const useParadiseFireDemo = () => {
  // FIX: Destructure from the store correctly
  const {
    simulationData,
    currentStage,
    status,
    error, // This now correctly exists on the state
    runStage: runStageAction,
    reset: resetAction,
  } = useParadiseFireDemoStore()

  const runStage = useCallback((stageIndex: number) => {
    return runStageAction(stageIndex)
  }, [runStageAction])

  const reset = useCallback(() => {
    return resetAction()
  }, [resetAction])

  return {
    simulationData,
    currentStage,
    isPending: status === 'pending',
    error, // And is returned here
    runStage,
    reset,
  }
}

if (process.env.NODE_ENV === 'development') {
  const MockAdapter = require('axios-mock-adapter')
  const mock = new MockAdapter(axios, { delayResponse: 500 })

  const PARADISE_CENTER = { lat: 39.7591, lon: -121.6175 }
  const FIRE_ORIGIN = { lat: 39.794, lon: -121.605 }

  const generateDemoDataForStage = (stage: number): DemoStageData => {
    let fires: any[] = []
    let emberArea: LngLatLike[] | undefined = undefined
    if (stage >= 0) {
      fires.push({ id: 'origin_fire', latitude: FIRE_ORIGIN.lat, longitude: FIRE_ORIGIN.lon, brightness: 350, confidence: 95, })
    }
    if (stage >= 1) {
      fires = Array.from({ length: 10 }, (_, i) => ({ id: `spread_${i}`, latitude: FIRE_ORIGIN.lat - i * 0.005, longitude: FIRE_ORIGIN.lon + i * 0.002, brightness: 380 + i * 5, confidence: 90, }))
    }
    if (stage >= 2) {
      fires = Array.from({ length: 50 }, (_, i) => ({ id: `large_spread_${i}`, latitude: FIRE_ORIGIN.lat - Math.random() * 0.1, longitude: FIRE_ORIGIN.lon + Math.random() * 0.05, brightness: 450 + Math.random() * 50, confidence: 98, }))
      const emberCenter = { lat: PARADISE_CENTER.lat, lon: PARADISE_CENTER.lon }
      const size = 0.08
      emberArea = [ [emberCenter.lon - size, emberCenter.lat - size], [emberCenter.lon + size, emberCenter.lat - size], [emberCenter.lon + size, emberCenter.lat + size], [emberCenter.lon - size, emberCenter.lat + size], [emberCenter.lon - size, emberCenter.lat - size], ]
    }
    if (stage >= 3) {
      const paradiseFires = Array.from({ length: 100 }, (_, i) => ({ id: `paradise_spot_${i}`, latitude: PARADISE_CENTER.lat + (Math.random() - 0.5) * 0.1, longitude: PARADISE_CENTER.lon + (Math.random() - 0.5) * 0.1, brightness: 400 + Math.random() * 80, confidence: 85, }))
      fires.push(...paradiseFires)
    }
    return { stage, timestamp: new Date().toISOString(), fire_locations: fires, ember_prediction_area: emberArea, weather_stations: [ { id: 'jarbo_gap', latitude: 39.7, longitude: -121.5, wind_speed: 40 + stage * 5 }, ], }
  }

  // FIX: Add explicit type for config parameter
  mock.onGet(/\/api\/demo\/paradise-fire\/stage\/(\d+)/).reply((config: AxiosRequestConfig) => {
    const stage = parseInt(config.url?.split('/').pop() || '0', 10)
    console.log(`Axios mock: Intercepted GET for Paradise Demo Stage ${stage}`)
    return [200, generateDemoDataForStage(stage)]
  })
}