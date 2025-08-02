import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import axios, { AxiosError } from 'axios'
import { useEffect, useRef } from 'react'
import { LngLatLike } from 'mapbox-gl'

// --- TYPE DEFINITIONS ---
// Defines the shape of data fetched from the real-time data endpoint.

export interface ActiveFire {
  id: string
  latitude: number
  longitude: number
  brightness: number // Kelvin
  confidence: number // 0-100%
  source: 'NASA FIRMS' | 'CAL FIRE'
  timestamp: string
}

export interface WeatherStation {
  id: string
  name: string
  latitude: number
  longitude: number
  temperature: number // Celsius
  humidity: number // Percentage
  wind_speed: number // mph
  wind_direction: string // e.g., 'NW'
}

export interface HighRiskArea {
  id: string
  name: string
  risk_level: number // 0.0 to 1.0
  cause: 'Drought' | 'Wind Pattern' | 'High Fuel Load'
  // A GeoJSON-compatible polygon definition
  polygon: LngLatLike[]
}

export interface Alert {
  id: string
  title: string
  message: string
  severity: 'critical' | 'high' | 'moderate'
  timestamp: string
  location?: {
    name: string
    latitude: number
    longitude: number
  }
}

// The comprehensive data structure for the entire real-time feed.
export interface RealTimeData {
  active_fires: ActiveFire[]
  weather_stations: WeatherStation[]
  high_risk_areas: HighRiskArea[]
  alerts: Alert[]
  current_conditions: {
    avg_wind_speed: number
    max_temp: number
  }
}

// --- ZUSTAND STORE DEFINITION ---

interface RealTimeDataState {
  // --- STATE ---
  fireData: RealTimeData | null
  isLoading: boolean
  error: string | null
  lastFetchTimestamp: Date | null
  systemStatus: 'operational' | 'degraded' | 'offline'

  // --- ACTIONS ---

  /**
   * Fetches the latest real-time data from the backend.
   */
  fetchData: () => Promise<void>
}

const useRealTimeDataStore = create<RealTimeDataState>()(
    immer((set, get) => ({
      // --- INITIAL STATE ---
      fireData: null,
      isLoading: true,
      error: null,
      lastFetchTimestamp: null,
      systemStatus: 'operational',

      // --- ACTION IMPLEMENTATIONS ---
      fetchData: async () => {
        // Prevent fetching if a request is already in flight.
        if (get().isLoading && get().lastFetchTimestamp) {
          return;
        }

        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await axios.get('/api/data/real-time')

          if (!response.data) {
            throw new Error('No data returned from real-time endpoint.')
          }

          set((state) => {
            state.fireData = response.data
            state.isLoading = false
            state.lastFetchTimestamp = new Date()
            state.systemStatus = 'operational'
          })
        } catch (err) {
          console.error("Real-Time Data Fetch Error:", err)
          let errorMessage = 'Failed to fetch live data feed.'
          if (axios.isAxiosError(err)) {
            errorMessage = err.response?.data?.error || err.message
          } else if (err instanceof Error) {
            errorMessage = err.message
          }

          set((state) => {
            state.isLoading = false
            state.error = errorMessage
            state.systemStatus = 'degraded'
          })
        }
      },
    }))
)

/**
 * --- CUSTOM HOOK FOR COMPONENT USAGE ---
 * This is the primary hook that UI components will use. It wraps the Zustand store
 * and adds logic for periodic polling.
 *
 * @param {number} pollInterval - The interval in milliseconds to poll for new data.
 * @returns An object containing derived data and status flags for easy consumption.
 */
export const useRealTimeData = (pollInterval: number = 30000) => {
  const store = useRealTimeDataStore()
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Effect to set up and tear down the polling interval.
  useEffect(() => {
    // Fetch data immediately on mount.
    store.fetchData()

    // Clear any existing interval before setting a new one.
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => {
      store.fetchData()
    }, pollInterval)

    // Cleanup function to clear the interval when the component unmounts.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [pollInterval, store.fetchData])

  // --- DERIVED DATA SELECTORS ---
  // This is more efficient than calculating in components, as it only re-computes when source data changes.
  const activeFireCount = store.fireData?.active_fires?.length || 0
  const activeAlerts = store.fireData?.alerts || []
  const highRiskAreas = store.fireData?.high_risk_areas || []

  return {
    fireData: store.fireData,
    weatherData: {
      stations: store.fireData?.weather_stations || [],
      current_conditions: store.fireData?.current_conditions,
    },
    activeFireCount,
    activeAlerts,
    highRiskAreas,
    systemStatus: store.systemStatus,
    isLoadingFireData: store.isLoading,
    error: store.error,
    lastFetchTimestamp: store.lastFetchTimestamp
  }
}


/**
 * --- MOCKING FOR DEVELOPMENT ---
 * Sets up a mock adapter for Axios to simulate the real-time data feed.
 * This is essential for UI development and testing without a live backend.
 */
if (process.env.NODE_ENV === 'development') {
  const MockAdapter = require('axios-mock-adapter')
  const mock = new MockAdapter(axios, { delayResponse: 800 })

  // --- Mock Data Generation Utilities ---
  // These functions create realistic and varied mock data.

  const getRandomCoordinate = (baseLat: number, baseLon: number, range: number) => ({
    latitude: baseLat + (Math.random() - 0.5) * range,
    longitude: baseLon + (Math.random() - 0.5) * range,
  })

  const generateMockFires = (count: number): ActiveFire[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `fire_${i}_${Date.now()}`,
      ...getRandomCoordinate(39.7, -121.5, 2.5), // Centered around Northern California
      brightness: Math.floor(Math.random() * 100 + 300),
      confidence: Math.floor(Math.random() * 50 + 50),
      source: 'NASA FIRMS',
      timestamp: new Date().toISOString(),
    }))
  }

  const generateMockWeatherStations = (count: number): WeatherStation[] => {
    return Array.from({ length: count }, (_, i) => ({
      id: `station_${i}`,
      name: `Station #${i}`,
      ...getRandomCoordinate(39.7, -121.5, 3),
      temperature: Math.floor(Math.random() * 15 + 20),
      humidity: Math.floor(Math.random() * 40 + 15),
      wind_speed: Math.floor(Math.random() * 25 + 5),
      wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    }));
  };

  const generateMockRiskAreas = (count: number): HighRiskArea[] => {
    return Array.from({ length: count }, (_, i) => {
      const center = getRandomCoordinate(39.7, -121.5, 2);
      const size = Math.random() * 0.1 + 0.05;
      const polygon: LngLatLike[] = [
        [center.longitude - size, center.latitude - size],
        [center.longitude + size, center.latitude - size],
        [center.longitude + size, center.latitude + size],
        [center.longitude - size, center.latitude + size],
        [center.longitude - size, center.latitude - size],
      ];
      return {
        id: `risk_area_${i}`,
        name: `Zone ${String.fromCharCode(65 + i)}`,
        risk_level: Math.random() * 0.6 + 0.4, // High risk levels
        cause: ['Drought', 'Wind Pattern', 'High Fuel Load'][Math.floor(Math.random() * 3)] as any,
        polygon,
      };
    });
  };

  const generateMockAlerts = (fires: ActiveFire[], areas: HighRiskArea[]): Alert[] => {
    const alerts: Alert[] = [];
    if (fires.length > 5) {
      alerts.push({
        id: `alert_fire_count`,
        title: 'Multiple New Fire Ignitions Detected',
        message: `${fires.length} new potential fires detected in the last 30 minutes. System is actively monitoring spread.`,
        severity: 'high',
        timestamp: new Date().toISOString()
      })
    }
    const criticalArea = areas.find(a => a.risk_level > 0.9);
    if (criticalArea) {
      alerts.push({
        id: `alert_risk_${criticalArea.id}`,
        title: `Critical Risk in ${criticalArea.name}`,
        message: `Fuel and weather conditions have reached critical levels. Immediate spread is highly likely if ignition occurs.`,
        severity: 'critical',
        timestamp: new Date().toISOString(),
        location: { name: criticalArea.name, ...getRandomCoordinate(0, 0, 0)} // Placeholder
      })
    }
    return alerts;
  }

  // --- Mock API Endpoint Definition ---
  mock.onGet('/api/data/real-time').reply(() => {
    console.log("Axios mock: Intercepted GET /api/data/real-time")

    const mockFires = generateMockFires(Math.floor(Math.random() * 8));
    const mockStations = generateMockWeatherStations(10);
    const mockAreas = generateMockRiskAreas(3);
    const mockAlerts = generateMockAlerts(mockFires, mockAreas);

    const mockData: RealTimeData = {
      active_fires: mockFires,
      weather_stations: mockStations,
      high_risk_areas: mockAreas,
      alerts: mockAlerts,
      current_conditions: {
        avg_wind_speed: Math.floor(Math.random() * 15 + 10),
        max_temp: Math.floor(Math.random() * 10 + 25),
      }
    }
    return [200, mockData]
  })
}