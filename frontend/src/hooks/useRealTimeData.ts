import { useState, useEffect, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { useFirePredictionStore } from '@/lib/store'
import toast from 'react-hot-toast'

interface Alert {
  id: string
  type: 'fire' | 'weather' | 'evacuation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  location?: {
    latitude: number
    longitude: number
  }
  timestamp: string
}

// Add types for your API responses
interface FireDataResponse {
  data: {
    active_fires: any[];
  }
}

interface WeatherDataResponse {
  data: any;
}

export function useRealTimeData() {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([])
  const [activeFireCount, setActiveFireCount] = useState(0)
  const [highRiskAreas, setHighRiskAreas] = useState(0)
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([])

  const {
    setFireData,
    setWeatherData,
    addAlert,
    fireData,
    weatherData
  } = useFirePredictionStore()

  // Fetch fire data
  const { data: fireDataResponse } = useQuery<FireDataResponse>({
    queryKey: ['fire-data'],
    queryFn: () => api.getFireData(),
    refetchInterval: 60000, // Refresh every minute
    onSuccess: (data) => {
      setFireData(data.data)
      setActiveFireCount(data.data?.active_fires?.length || 0)
    }
  })

  // Fetch weather data
  const { data: weatherDataResponse } = useQuery<WeatherDataResponse>({
    queryKey: ['weather-data'],
    queryFn: () => api.getWeatherData(),
    refetchInterval: 300000, // Refresh every 5 minutes
    onSuccess: (data) => {
      setWeatherData(data.data)
    }
  })

  // Subscribe to real-time alerts
  useEffect(() => {
    const unsubscribe = api.subscribeToAlerts((alert: any) => {
      const newAlert: Alert = {
        id: `alert_${Date.now()}`,
        type: alert.type || 'fire',
        severity: alert.severity || 'medium',
        title: alert.title || 'New Alert',
        message: alert.message || 'Alert received',
        location: alert.location,
        timestamp: new Date().toISOString()
      }

      setActiveAlerts(prev => [newAlert, ...prev].slice(0, 50))
      addAlert(newAlert)

      // Show toast for high severity alerts
      if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
        toast.error(newAlert.message, { duration: 10000 })
      }
    })

    return () => unsubscribe()
  }, [addAlert])

  // Calculate high risk areas from fire data
  useEffect(() => {
    if (fireData?.active_fires) {
      const highRisk = fireData.active_fires.filter(
          (fire: any) => fire.intensity > 0.7 || fire.confidence > 0.8
      ).length
      setHighRiskAreas(highRisk)
    }
  }, [fireData])

  // Subscribe to updates callback
  const subscribeToUpdates = useCallback((callback: (update: any) => void) => {
    // This is a mock subscription, adjust if you have a real WebSocket/SSE implementation
    const interval = setInterval(() => {
      if (activeAlerts.length > 0) {
        callback({
          type: 'alert',
          data: activeAlerts[0],
          severity: activeAlerts[0].severity
        })
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [activeAlerts])

  return {
    // Data
    fireData,
    weatherData,
    activeAlerts,
    activeFireCount,
    highRiskAreas,
    weatherAlerts,

    // Actions
    subscribeToUpdates,

    // Loading states
    isLoadingFireData: !fireDataResponse,
    isLoadingWeatherData: !weatherDataResponse
  }
}