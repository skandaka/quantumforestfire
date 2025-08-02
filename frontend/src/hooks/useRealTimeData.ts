'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface FireData {
  id: string;
  latitude: number;
  longitude: number;
  intensity: number;
  area_hectares: number;
  confidence: number;
  brightness_temperature: number;
  detection_time: string;
  satellite: string;
  frp: number;
}

interface WeatherData {
  stations: Array<{
    station_id: string;
    latitude: number;
    longitude: number;
    temperature: number;
    humidity: number;
    wind_speed: number;
    wind_direction: number;
    pressure: number;
  }>;
  current_conditions: {
    avg_temperature: number;
    avg_humidity: number;
    avg_wind_speed: number;
    max_wind_speed: number;
    dominant_wind_direction: number;
    fuel_moisture?: number;
  };
  fire_weather?: {
    fosberg_index: number;
    red_flag_warning: boolean;
  };
  metadata: {
    source: string;
    collection_time: string;
  };
}

interface RealTimeData {
  active_fires: FireData[];
  weather: WeatherData;
  terrain: any;
  metadata: {
    processing_time: number;
    sources: string[];
    timestamp: string;
    data_quality: string;
  };
}

interface UseRealTimeDataReturn {
  data: RealTimeData | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshData: () => Promise<void>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  // Legacy properties that your components expect
  fireData: FireData[];
  weatherData: WeatherData | null;
  activeFireCount: number;
  activeAlerts: any[];
  highRiskAreas: any[];
  systemStatus: string;
  isLoadingFireData: boolean;
}

const useRealTimeData = (
    autoRefresh: boolean = true,
    refreshInterval: number = 30000 // 30 seconds
): UseRealTimeDataReturn => {
  const [data, setData] = useState<RealTimeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchData = useCallback(async () => {
    try {
      setConnectionStatus('connecting');

      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const response = await fetch(`${API_BASE_URL}/api/v1/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 'success') {
        // Get the actual data
        const dataResponse = await fetch(`${API_BASE_URL}/api/v1/fires`, {
          signal: abortControllerRef.current.signal,
        });

        if (dataResponse.ok) {
          const fireData = await dataResponse.json();

          // Get weather data
          const weatherResponse = await fetch(`${API_BASE_URL}/api/v1/weather`, {
            signal: abortControllerRef.current.signal,
          });

          let weatherData = null;
          if (weatherResponse.ok) {
            const weatherResult = await weatherResponse.json();
            weatherData = weatherResult.data;
          }

          // Construct combined data
          const combinedData: RealTimeData = {
            active_fires: fireData.data?.active_fires || [],
            weather: weatherData || {
              stations: [],
              current_conditions: {
                avg_temperature: 20,
                avg_humidity: 50,
                avg_wind_speed: 10,
                max_wind_speed: 15,
                dominant_wind_direction: 0
              },
              metadata: {
                source: 'Fallback',
                collection_time: new Date().toISOString()
              }
            },
            terrain: {},
            metadata: {
              processing_time: 0,
              sources: ['API'],
              timestamp: new Date().toISOString(),
              data_quality: 'high'
            }
          };

          setData(combinedData);
          setLastUpdated(new Date());
          setError(null);
          setConnectionStatus('connected');
        } else {
          throw new Error('Failed to fetch fire data');
        }
      } else {
        throw new Error(result.message || 'Failed to refresh data');
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return;
        }
        console.error('Real-Time Data Fetch Error:', err);
        setError(err.message);
      } else {
        console.error('Unknown error:', err);
        setError('An unknown error occurred');
      }
      setConnectionStatus('disconnected');

      // Set fallback demo data if no data exists
      if (!data) {
        const fallbackData: RealTimeData = {
          active_fires: [
            {
              id: 'demo_fire_001',
              latitude: 39.7596,
              longitude: -121.6219,
              intensity: 0.85,
              area_hectares: 1500,
              confidence: 90,
              brightness_temperature: 420,
              detection_time: new Date().toISOString(),
              satellite: 'Demo Data',
              frp: 500
            },
            {
              id: 'demo_fire_002',
              latitude: 38.5800,
              longitude: -121.4900,
              intensity: 0.68,
              area_hectares: 890,
              confidence: 85,
              brightness_temperature: 410,
              detection_time: new Date().toISOString(),
              satellite: 'Demo Data',
              frp: 340
            }
          ],
          weather: {
            stations: [
              {
                station_id: 'DEMO_001',
                latitude: 39.7596,
                longitude: -121.6219,
                temperature: 28.5,
                humidity: 18.0,
                wind_speed: 35.2,
                wind_direction: 45.0,
                pressure: 1013.25
              }
            ],
            current_conditions: {
              avg_temperature: 29.8,
              avg_humidity: 16.8,
              avg_wind_speed: 39.0,
              max_wind_speed: 65.5,
              dominant_wind_direction: 48.5,
              fuel_moisture: 6.2
            },
            fire_weather: {
              fosberg_index: 82.5,
              red_flag_warning: true
            },
            metadata: {
              source: 'Demo Data',
              collection_time: new Date().toISOString()
            }
          },
          terrain: {},
          metadata: {
            processing_time: 0,
            sources: ['Demo'],
            timestamp: new Date().toISOString(),
            data_quality: 'demo'
          }
        };
        setData(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, data]);

  const refreshData = useCallback(async () => {
    setLoading(true);
    await fetchData();
  }, [fetchData]);

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(() => {
        fetchData();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Calculate derived values for backward compatibility
  const fireData = data?.active_fires || [];
  const weatherData = data?.weather || null;
  const activeFireCount = fireData.length;
  const activeAlerts: any[] = [];
  const highRiskAreas: any[] = [];
  const systemStatus = connectionStatus === 'connected' ? 'operational' : 'degraded';
  const isLoadingFireData = loading;

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshData,
    connectionStatus,
    // Legacy properties for backward compatibility
    fireData,
    weatherData,
    activeFireCount,
    activeAlerts,
    highRiskAreas,
    systemStatus,
    isLoadingFireData,
  };
};

// CRITICAL: This is the key fix - export as default
export default useRealTimeData;
