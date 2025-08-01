import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useFirePredictionStore } from '@/lib/store';
import toast from 'react-hot-toast';

// --- Type Definitions ---
interface Alert {
  id: string;
  type: 'fire' | 'weather' | 'evacuation' | 'high_risk';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
  };
  timestamp: string;
  probability?: number;
}

interface FireDataResponse {
  data: {
    active_fires: Array<{
      id: string;
      latitude: number;
      longitude: number;
      center_lat: number;
      center_lon: number;
      intensity: number;
      area_hectares: number;
      confidence: number;
      brightness_temperature: number;
      detection_time: string;
      satellite: string;
      frp: number;
    }>;
    metadata: {
      source: string;
      total_detections: number;
      last_updated: string;
    };
  };
}

interface WeatherDataResponse {
  data: {
    current_conditions: {
      avg_temperature: number;
      avg_humidity: number;
      avg_wind_speed: number;
      max_wind_speed: number;
      dominant_wind_direction: number;
    };
    forecast: Array<{
      time: string;
      temperature: number;
      humidity: number;
      wind_speed: number;
      wind_direction: number;
    }>;
  };
}

export function useRealTimeData() {
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [activeFireCount, setActiveFireCount] = useState(0);
  const [highRiskAreas, setHighRiskAreas] = useState(0);
  const [weatherAlerts, setWeatherAlerts] = useState<any[]>([]);
  const [systemStatus, setSystemStatus] = useState('operational');
  const [isConnected, setIsConnected] = useState(false);

  const [isLoadingFireData, setIsLoadingFireData] = useState(true);
  const [isLoadingWeatherData, setIsLoadingWeatherData] = useState(true);

  const {
    setFireData,
    setWeatherData,
    addAlert,
    fireData,
    weatherData,
  } = useFirePredictionStore();

  // Enhanced data fetching with fallback
  const fetchRealTimeData = useCallback(async () => {
    try {
      setIsLoadingFireData(true);
      setIsLoadingWeatherData(true);
      
      // Try to fetch from backend
      const fireResponse = await fetch('http://localhost:8000/api/data/fires');
      const weatherResponse = await fetch('http://localhost:8000/api/data/weather');
      
      if (fireResponse.ok && weatherResponse.ok) {
        const fireData = await fireResponse.json();
        const weatherData = await weatherResponse.json();
        
        setFireData(fireData);
        setWeatherData(weatherData);
        setActiveFireCount(fireData.active_fires?.length || 0);
        setIsConnected(true);
        
        // Generate alerts based on data
        const newAlerts: Alert[] = [];
        
        fireData.active_fires?.forEach((fire: any) => {
          if (fire.intensity > 0.7) {
            newAlerts.push({
              id: `fire_alert_${fire.id}`,
              type: 'fire',
              severity: fire.intensity > 0.9 ? 'critical' : 'high',
              title: 'High Intensity Fire Detected',
              message: `Fire with ${(fire.intensity * 100).toFixed(0)}% intensity detected`,
              location: {
                latitude: fire.center_lat,
                longitude: fire.center_lon,
                name: `Fire Zone ${fire.id}`
              },
              timestamp: fire.detection_time || new Date().toISOString()
            });
          }
        });
        
        if (weatherData.current_conditions?.avg_wind_speed > 20) {
          newAlerts.push({
            id: 'wind_alert',
            type: 'weather',
            severity: 'high',
            title: 'High Wind Conditions',
            message: `Wind speed ${weatherData.current_conditions.avg_wind_speed} mph - increased fire risk`,
            timestamp: new Date().toISOString()
          });
        }
        
        setActiveAlerts(newAlerts);
        
      } else {
        throw new Error('Backend not available');
      }
    } catch (error) {
      console.warn('Backend not available, using enhanced mock data');
      setIsConnected(false);
      
      // Enhanced mock data
      const mockFireData = {
        active_fires: [
          {
            id: 'ca_fire_001',
            latitude: 39.7596,
            longitude: -121.6219,
            center_lat: 39.7596,
            center_lon: -121.6219,
            intensity: 0.89,
            area_hectares: 2850,
            confidence: 0.94,
            brightness_temperature: 445,
            detection_time: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            satellite: 'NASA MODIS',
            frp: 680
          },
          {
            id: 'ca_fire_002',
            latitude: 39.7200,
            longitude: -121.5800,
            center_lat: 39.7200,
            center_lon: -121.5800,
            intensity: 0.71,
            area_hectares: 1450,
            confidence: 0.87,
            brightness_temperature: 398,
            detection_time: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
            satellite: 'NASA VIIRS',
            frp: 420
          },
          {
            id: 'ca_fire_003',
            latitude: 38.9167,
            longitude: -121.6167,
            center_lat: 38.9167,
            center_lon: -121.6167,
            intensity: 0.62,
            area_hectares: 980,
            confidence: 0.85,
            brightness_temperature: 385,
            detection_time: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
            satellite: 'NASA MODIS',
            frp: 310
          }
        ],
        metadata: {
          source: 'Enhanced Mock Data (Backend Unavailable)',
          total_detections: 3,
          last_updated: new Date().toISOString()
        }
      };

      const mockWeatherData = {
        current_conditions: {
          avg_temperature: 32,
          avg_humidity: 28,
          avg_wind_speed: 22,
          max_wind_speed: 35,
          dominant_wind_direction: 45
        },
        forecast: [
          {
            time: new Date(Date.now() + 3600000).toISOString(),
            temperature: 34,
            humidity: 25,
            wind_speed: 28,
            wind_direction: 50
          },
          {
            time: new Date(Date.now() + 7200000).toISOString(),
            temperature: 35,
            humidity: 22,
            wind_speed: 32,
            wind_direction: 55
          }
        ]
      };

      setFireData(mockFireData);
      setWeatherData(mockWeatherData);
      setActiveFireCount(mockFireData.active_fires.length);
      setHighRiskAreas(2);

      // Generate mock alerts
      const mockAlerts: Alert[] = [
        {
          id: 'alert_high_intensity',
          type: 'fire',
          severity: 'critical',
          title: 'Critical Fire Intensity',
          message: 'Fire CA_001 showing 89% intensity - immediate evacuation may be required',
          location: {
            latitude: 39.7596,
            longitude: -121.6219,
            name: 'Paradise Area'
          },
          timestamp: new Date().toISOString(),
          probability: 0.89
        },
        {
          id: 'alert_wind_conditions',
          type: 'weather',
          severity: 'high',
          title: 'Dangerous Wind Conditions',
          message: 'Wind speeds 22 mph with gusts to 35 mph - rapid fire spread possible',
          timestamp: new Date().toISOString()
        },
        {
          id: 'alert_quantum_prediction',
          type: 'high_risk',
          severity: 'high',
          title: 'Quantum Model Alert',
          message: 'High probability ember transport detected - new ignition risk elevated',
          location: {
            latitude: 39.8000,
            longitude: -121.5500,
            name: 'Potential Impact Zone'
          },
          timestamp: new Date().toISOString(),
          probability: 0.78
        }
      ];

      setActiveAlerts(mockAlerts);
    } finally {
      setIsLoadingFireData(false);
      setIsLoadingWeatherData(false);
    }
  }, [setFireData, setWeatherData, addAlert]);

  // Use direct effect instead of react-query for better control
  useEffect(() => {
    fetchRealTimeData();
    
    // Set up polling
    const interval = setInterval(fetchRealTimeData, 30000);
    
    return () => clearInterval(interval);
  }, [fetchRealTimeData]);

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
    weatherAlerts,
    systemStatus,
    isConnected,

    // Actions
    subscribeToUpdates,
    refetch: fetchRealTimeData,

    // Loading states
    isLoadingFireData,
    isLoadingWeatherData,
  };
}