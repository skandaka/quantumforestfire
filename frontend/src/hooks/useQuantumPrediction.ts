import { create } from 'zustand'
import axios, { AxiosError, AxiosRequestConfig } from 'axios'
import { immer } from 'zustand/middleware/immer'
import { useCallback } from 'react'

// --- TYPE DEFINITIONS ---
export interface PredictionRequest {
  model: string
  location: {
    latitude: number
    longitude: number
  }
  radius: number
  timeHorizon: number
  useQuantumHardware: boolean
  includeEmberAnalysis: boolean
  hardwareProvider: string
}

export interface PredictionResult {
  request_id: string
  timestamp: string
  request_params: PredictionRequest
  predictions: {
    risk_level: 'Low' | 'Moderate' | 'High' | 'Critical'
    max_fire_prob: number
    estimated_area_sqkm: number
    key_findings: string[]
    fire_probability_map: number[][]
  }[]
}

export interface QuantumMetrics {
  synthesis: {
    provider: 'classiq' | 'qiskit'
    qubit_count: number
    depth: number
    gate_count: number
    synthesis_time: number
  }
  execution: {
    provider: string
    shots: number
    execution_time: number
    result_confidence: number
  }
  distribution: Record<string, number>
}

export type SystemStatus = 'operational' | 'degraded' | 'maintenance' | 'offline'

interface QuantumPredictionState {
  currentPrediction: (PredictionResult & { quantumMetrics?: QuantumMetrics }) | null
  predictionHistory: (PredictionResult & { quantumMetrics?: QuantumMetrics })[]
  status: 'idle' | 'pending' | 'success' | 'error'
  error: string | null
  currentJobId: string | null
  systemStatus: SystemStatus
  lastStatusCheck: Date | null
  runPrediction: (request: PredictionRequest) => Promise<void>
  fetchSystemStatus: () => Promise<void>
  reset: () => void
  _addToHistory: (prediction: PredictionResult & { quantumMetrics?: QuantumMetrics }) => void
}

const useQuantumPredictionStore = create<QuantumPredictionState>()(
    immer((set, get) => ({
      currentPrediction: null,
      predictionHistory: [],
      status: 'idle',
      error: null,
      currentJobId: null,
      systemStatus: 'operational',
      lastStatusCheck: null,
      runPrediction: async (request: PredictionRequest) => {
        set((state) => {
          state.status = 'pending'
          state.error = null
          state.currentPrediction = null
          state.currentJobId = `job_${Date.now()}`
        })
        try {
          const response = await axios.post('/api/predict', request, { timeout: 120000 })
          if (!response.data || !response.data.predictions) {
            throw new Error("Invalid response structure from backend.")
          }
          const result: PredictionResult = response.data.prediction
          const metrics: QuantumMetrics = response.data.quantum_metrics
          set((state) => {
            const fullResult = { ...result, quantumMetrics: metrics }
            state.status = 'success'
            state.currentPrediction = fullResult
            state.currentJobId = result.request_id
            state._addToHistory(fullResult)
          })
        } catch (err) {
          let errorMessage = 'An unknown error occurred during prediction.'
          if (axios.isAxiosError(err)) {
            const axiosError = err as AxiosError<any>
            if (axiosError.response?.data?.error) {
              errorMessage = axiosError.response.data.error
            } else if (axiosError.code === 'ECONNABORTED') {
              errorMessage = 'The prediction request timed out. The system may be under heavy load.'
            } else {
              errorMessage = axiosError.message
            }
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
      fetchSystemStatus: async () => {
        const now = new Date();
        const lastCheck = get().lastStatusCheck;
        if (lastCheck && now.getTime() - lastCheck.getTime() < 30000) {
          return;
        }
        set(state => { state.lastStatusCheck = now; });
        try {
          const response = await axios.get('/api/system-status')
          const newStatus = response.data.status as SystemStatus
          if (newStatus !== get().systemStatus) {
            set(state => { state.systemStatus = newStatus })
          }
        } catch (error) {
          set(state => { state.systemStatus = 'degraded' })
        }
      },
      reset: () => {
        set({
          currentPrediction: null,
          status: 'idle',
          error: null,
          currentJobId: null,
        })
      },
      _addToHistory: (prediction) => {
        set(state => {
          state.predictionHistory.unshift(prediction)
          if (state.predictionHistory.length > 10) {
            state.predictionHistory.pop()
          }
        })
      }
    }))
)

/**
 * --- CUSTOM HOOK FOR COMPONENT USAGE ---
 * This is the primary hook that UI components should use. It provides a stable,
 * memoized interface and derives convenient boolean flags like `isPending`.
 */
export const useQuantumPrediction = () => {
  const state = useQuantumPredictionStore();

  // The component that uses this hook will get a consistent set of values.
  const isPending = state.status === 'pending';
  const quantumMetrics = state.currentPrediction?.quantumMetrics;

  // We use useCallback to memoize the action functions, preventing
  // unnecessary re-renders in child components that depend on them.
  const runPrediction = useCallback((request: PredictionRequest) => {
    return state.runPrediction(request);
  }, [state.runPrediction]);

  const reset = useCallback(() => {
    return state.reset();
  }, [state.reset]);

  return {
    ...state,
    isPending,
    quantumMetrics,
    runPrediction,
    reset
  };
};


if (process.env.NODE_ENV === 'development') {
  const MockAdapter = require('axios-mock-adapter')
  const mock = new MockAdapter(axios, { delayResponse: 2500 })

  mock.onPost('/api/predict').reply((config: { data: string }) => {
    const requestData = JSON.parse(config.data) as PredictionRequest;

    if (requestData.model === 'qiskit_fire_spread') {
      return [400, { error: 'Qiskit simulator is currently offline for maintenance.' }]
    }

    const requestId = `mock_req_${Math.random().toString(36).substring(7)}`

    const generateFireMap = (rows: number, cols: number): number[][] => {
      const map = Array.from({ length: rows }, () => Array(cols).fill(0));
      const fireCenters = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
        r: Math.floor(Math.random() * rows),
        c: Math.floor(Math.random() * cols),
        intensity: Math.random() * 0.7 + 0.3
      }));

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          let prob = 0;
          for (const center of fireCenters) {
            const dist = Math.sqrt(Math.pow(r - center.r, 2) + Math.pow(c - center.c, 2));
            const influence = center.intensity * Math.exp(-Math.pow(dist, 2) / (2 * Math.pow(rows / 8, 2)));
            prob += influence;
          }
          map[r][c] = Math.min(1.0, prob + (Math.random() - 0.5) * 0.1);
        }
      }
      return map;
    };

    const fireMap = generateFireMap(50, 50);
    const maxProb = Math.max(...fireMap.flat());

    const mockPrediction: PredictionResult = {
      request_id: requestId,
      timestamp: new Date().toISOString(),
      request_params: requestData,
      predictions: [
        {
          risk_level: maxProb > 0.8 ? 'Critical' : maxProb > 0.6 ? 'High' : maxProb > 0.3 ? 'Moderate' : 'Low',
          max_fire_prob: maxProb,
          estimated_area_sqkm: Math.floor(Math.random() * 1000 + 50),
          key_findings: [
            "Strong easterly winds are driving rapid spread.",
            "High probability of ember transport towards populated areas.",
            "Critical fuel dryness levels detected via satellite.",
          ],
          fire_probability_map: fireMap,
        },
      ],
    }

    const mockMetrics: QuantumMetrics = {
      synthesis: {
        provider: 'classiq',
        qubit_count: requestData.includeEmberAnalysis ? 32 : 16,
        depth: Math.floor(Math.random() * 200 + 50),
        gate_count: Math.floor(Math.random() * 5000 + 1000),
        synthesis_time: Math.random() * 5 + 1,
      },
      execution: {
        provider: requestData.useQuantumHardware ? 'IonQ Aria' : 'Classiq Cloud Simulator',
        shots: 8192,
        execution_time: Math.random() * 15 + 5,
        result_confidence: Math.random() * 0.1 + 0.89,
      },
      distribution: {
        '|01101⟩': 0.35,
        '|10110⟩': 0.28,
        '|01111⟩': 0.15,
        '|11001⟩': 0.12,
        'other': 0.10
      }
    }

    return [200, {
      prediction: mockPrediction,
      quantum_metrics: mockMetrics
    }];
  });

  mock.onGet('/api/system-status').reply(200, {
    status: 'operational',
    timestamp: new Date().toISOString(),
    details: {
      quantum_api: 'online',
      data_ingestion: 'online',
      prediction_queue: 3,
    }
  });
}