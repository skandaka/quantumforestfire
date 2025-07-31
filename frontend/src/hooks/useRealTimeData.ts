import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFirePredictionStore } from '@/lib/store';
import toast from 'react-hot-toast';

// --- Type Definitions ---
interface Alert {
  id: string;
  type: 'fire' | 'weather' | 'evacuation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
}

interface FireDataResponse {
  data: {
    active_fires: any[];
  };
}

interface WeatherDataResponse {
  data: any;
}

export function useRealTimeData() {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [activeFireCount, setActiveFireCount] = useState(0);
  const [highRiskAreas, setHighRiskAreas] = useState(0);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]); // This was not being returned

  const {
    setFireData,
    setWeatherData,
    addAlert,
    fireData,
    weatherData,
  } = useFirePredictionStore();

  // --- Data Fetching ---
  const { data: fireDataResponse, isLoading: isLoadingFireData } = useQuery<FireDataResponse, Error>({
    queryKey: ['fire-data'],
    queryFn: () => api.getFireData(),
    refetchInterval: 60000,
  });

  const { data: weatherDataResponse, isLoading: isLoadingWeatherData } = useQuery<WeatherDataResponse, Error>({
    queryKey: ['weather-data'],
    queryFn: () => api.getWeatherData(),
    refetchInterval: 300000,
  });

  // --- Effects for Handling Fetched Data ---
  useEffect(() => {
    if (fireDataResponse) {
      // ✅ **Fixed**: Add frontend validation for latitude
      const validatedFires = fireDataResponse.data?.active_fires?.filter(
          (fire: any) => fire.latitude >= -90 && fire.latitude <= 90
      );

      if (validatedFires) {
        const validatedData = { ...fireDataResponse.data, active_fires: validatedFires };
        setFireData(validatedData);
        setActiveFireCount(validatedFires.length || 0);
      }
    }
  }, [fireDataResponse, setFireData]);

  useEffect(() => {
    if (weatherDataResponse) {
      setWeatherData(weatherDataResponse.data);
      // You might want to process weather alerts here
      // For example: setWeatherAlerts(weatherDataResponse.data?.alerts || []);
    }
  }, [weatherDataResponse, setWeatherData]);


  // --- Real-time Alert Subscription ---
  useEffect(() => {
    const unsubscribe = api.subscribeToAlerts((alert: any) => {
      const newAlert: Alert = {
        id: `alert_${Date.now()}`,
        type: alert.type || 'fire',
        severity: alert.severity || 'medium',
        title: alert.title || 'New Alert',
        message: alert.message || 'Alert received',
        location: alert.location,
        timestamp: new Date().toISOString(),
      };

      setActiveAlerts((prev) => [newAlert, ...prev].slice(0, 50));
      addAlert(newAlert);

      if (newAlert.severity === 'critical' || newAlert.severity === 'high') {
        toast.error(newAlert.message, { duration: 10000 });
      }
    });

    return () => unsubscribe();
  }, [addAlert]);

  // --- Derived Data Calculation ---
  useEffect(() => {
    if (fireData?.active_fires) {
      const highRisk = fireData.active_fires.filter(
          (fire: any) => fire.intensity > 0.7 || fire.confidence > 0.8
      ).length;
      setHighRiskAreas(highRisk);
    }
  }, [fireData]);

  // --- Mock Subscription for Updates ---
  const subscribeToUpdates = useCallback((callback: (update: any) => void) => {
    const interval = setInterval(() => {
      if (activeAlerts.length > 0) {
        callback({
          type: 'alert',
          data: activeAlerts[0],
          severity: activeAlerts[0].severity,
        });
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [activeAlerts]);

  return {
    // Data
    fireData,
    weatherData,
    activeAlerts,
    activeFireCount,
    highRiskAreas,
    weatherAlerts, // ✅ Fixed: Now returning weatherAlerts

    // Actions
    subscribeToUpdates,

    // Loading states
    isLoadingFireData,
    isLoadingWeatherData,
  };
}