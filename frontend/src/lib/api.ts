import axios from 'axios'

// Determine backend base URL with Vercel-friendly fallbacks.
// Priority:
// 1. Explicit NEXT_PUBLIC_BACKEND_URL (new)
// 2. Legacy NEXT_PUBLIC_API_URL
// 3. If undefined/empty: use relative path ('') so calls hit same origin (ideal for Vercel + separate backend proxy/rewrite)
// 4. As last resort in local dev only: http://localhost:8000
// We avoid forcing localhost in production builds without env vars, preventing 404 or mixed-origin issues on Vercel.
function resolveRawBase() {
  const explicit = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_URL
  if (explicit && explicit.trim() !== '') return explicit.trim().replace(/\/$/, '')
  // If running in browser, prefer relative path (empty string) so fetches go to same host (with potential Vercel rewrites)
  if (typeof window !== 'undefined') return ''
  // On server (SSR) attempt to use VERCEL_URL if present to build absolute origin; else fallback to localhost
  const vercelUrl = process.env.VERCEL_URL
  if (vercelUrl) return `https://${vercelUrl}`
  return 'http://localhost:8000'
}

const RAW_BASE = resolveRawBase()
// FastAPI main app mounts v1 routes under /api/v1 (prediction_router & data_router)
const API_V1_PREFIX = '/api/v1'

function joinUrl(base: string, path: string) {
  if (/^https?:/i.test(path)) return path
  const trimmedBase = base.replace(/\/$/, '')
  const trimmedPath = path.replace(/^\//, '')
  return `${trimmedBase}${trimmedPath.startsWith('api/') ? '/' + trimmedPath : `${API_V1_PREFIX}/${trimmedPath}`}`
}

const API_BASE_URL = RAW_BASE

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
    (config) => {
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
)

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
      console.error('API Error:', error.response?.data || error.message)
      return Promise.reject(error)
    }
)

export const apiClient = {
  // System endpoints
  getSystemStatus: () => api.get('/health'),
  getMetrics: () => api.get('/api/metrics'),

  // Data endpoints
  getFireData: () => api.get(joinUrl(RAW_BASE, 'data/fires')),
  getWeatherData: () => api.get(joinUrl(RAW_BASE, 'data/weather')),
  getLocationData: (lat: number, lon: number, radius: number = 50) =>
      api.get(`/api/data/location/${lat}/${lon}?radius_km=${radius}`),

  // Prediction endpoints
  runPrediction: (request: any) => api.post(joinUrl(RAW_BASE, 'predictions/predict'), request),
  runParadiseDemo: () => api.get(joinUrl(RAW_BASE, 'predictions/predict/paradise-demo')),

  // Quantum endpoints
  getQuantumStatus: () => api.get(joinUrl(RAW_BASE, 'quantum/status')),
  getQuantumMetrics: () => api.get(joinUrl(RAW_BASE, 'quantum/metrics')),

  // Mock real-time subscription for now
  subscribeToAlerts: (callback: (alert: any) => void) => {
    // Mock subscription - replace with actual WebSocket in production
    const interval = setInterval(() => {
      const mockAlert = {
        type: 'fire',
        severity: Math.random() > 0.8 ? 'critical' : 'medium',
        title: 'Mock Fire Alert',
        message: 'This is a mock alert for development',
        timestamp: new Date().toISOString(),
      }
      if (Math.random() > 0.9) { // 10% chance of alert
        callback(mockAlert)
      }
    }, 10000)

    return () => clearInterval(interval)
  },
}

// Lightweight fetch helpers (non-axios) for components using native fetch
export async function apiFetch(path: string, init?: RequestInit) {
  return fetch(joinUrl(RAW_BASE, path), init)
}
export async function apiJson<T=any>(path: string, init?: RequestInit): Promise<T> {
  const res = await apiFetch(path, init)
  if (!res.ok) throw new Error(`API ${res.status} ${res.statusText} for ${path}`)
  return res.json() as Promise<T>
}

export const apiConfig = { base: RAW_BASE, v1Prefix: API_V1_PREFIX }

export { api as default, apiClient as api }