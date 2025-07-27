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
  const { data: fireDataResponse, isLoading: isLoadingFireData } = useQuery({
    queryKey: ['fire-data'],
    queryFn: () => api.getFireData(),
    refetchInterval: 60000, // Refresh every minute
  })

  useEffect(() => {
    if (fireDataResponse) {
      const data = fireDataResponse.data;
      setFireData(data)
      setActiveFireCount(data?.active_fires?.length || 0)
    }
  }, [fireDataResponse, setFireData])


  // Fetch weather data
  const { data: weatherDataResponse, isLoading: isLoadingWeatherData } = useQuery({
    queryKey: ['weather-data'],
    queryFn: () => api.getWeatherData(),
    refetchInterval: 300000, // Refresh every 5 minutes
  })

  useEffect(() => {
    if (weatherDataResponse) {
      setWeatherData(weatherDataResponse.data)
    }
  }, [weatherDataResponse, setWeatherData])


  // Subscribe to real-time alerts
  useEffect(() => {
    // This is a placeholder for a real WebSocket/SSE implementation
    // A real implementation would connect to the backend's /ws endpoint
    // and call the handler below.
    const handleAlert = (alert: any) => {
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

        if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
          toast.error(newAlert.message, { duration: 10000 })
        }
    };

    // To-do: connect to a real event source from api.ts
    // const unsubscribe = api.subscribeToAlerts(handleAlert);
    // return () => unsubscribe();

    return () => {}; // Placeholder cleanup
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

  const subscribeToUpdates = useCallback((callback: (update: any) => void) => {
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
    fireData,
    weatherData,
    activeAlerts,
    activeFireCount,
    highRiskAreas,
    weatherAlerts,
    subscribeToUpdates,
    isLoadingFireData,
    isLoadingWeatherData
  }
}