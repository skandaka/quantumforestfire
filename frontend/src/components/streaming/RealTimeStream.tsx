'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  AlertCircle, 
  Play, 
  Pause, 
  BarChart3,
  Thermometer,
  Wind,
  Droplets,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface StreamingData {
  timestamp: string
  fire_updates: any[]
  weather_updates: any[]
  risk_updates: any[]
  quantum_features: any
}

interface ConnectionStatus {
  connected: boolean
  latency: number
  reconnectAttempts: number
  lastPing: Date | null
}

interface RealTimeStreamProps {
  onDataUpdate?: (data: StreamingData) => void
  className?: string
}

// --- COMPONENTS ---

// Connection Status Indicator
function ConnectionStatusIndicator({ status }: { status: ConnectionStatus }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2">
        {status.connected ? (
          <Wifi className="w-4 h-4 text-green-400" />
        ) : (
          <WifiOff className="w-4 h-4 text-red-400" />
        )}
        <span className={cn(
          "text-sm font-medium",
          status.connected ? "text-green-400" : "text-red-400"
        )}>
          {status.connected ? "Connected" : "Disconnected"}
        </span>
      </div>
      
      {status.connected && (
        <div className="text-xs text-gray-400">
          {status.latency}ms
        </div>
      )}
      
      {status.reconnectAttempts > 0 && (
        <div className="text-xs text-orange-400">
          Retry: {status.reconnectAttempts}
        </div>
      )}
    </div>
  )
}

// Live Data Feed
function LiveDataFeed({ data }: { data: StreamingData[] }) {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight
    }
  }, [data])

  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 h-64">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <Activity className="w-5 h-5 text-blue-400" />
        Live Data Feed
      </h3>
      
      <div 
        ref={feedRef}
        className="h-48 overflow-y-auto space-y-2 text-sm"
      >
        {data.slice(-20).map((item, index) => (
          <motion.div
            key={`${item.timestamp}-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-3 p-2 bg-gray-900 rounded border border-gray-600"
          >
            <div className="text-gray-400 text-xs w-16 flex-shrink-0" suppressHydrationWarning>
              {typeof window === 'undefined' ? '' : new Date(item.timestamp).toLocaleTimeString()}
            </div>
            <div className="flex-1">
              {item.fire_updates.length > 0 && (
                <div className="text-red-400">
                  🔥 {item.fire_updates.length} fire update(s)
                </div>
              )}
              {item.weather_updates.length > 0 && (
                <div className="text-blue-400">
                  🌤️ Weather update: {item.weather_updates[0]?.condition || 'N/A'}
                </div>
              )}
              {item.risk_updates.length > 0 && (
                <div className="text-orange-400">
                  ⚠️ Risk level: {item.risk_updates[0]?.level || 'N/A'}
                </div>
              )}
            </div>
          </motion.div>
        ))}
        
        {data.length === 0 && (
          <div className="text-gray-500 text-center py-8">
            Waiting for streaming data...
          </div>
        )}
      </div>
    </div>
  )
}

// Weather Conditions Widget
function WeatherConditionsWidget({ weatherData }: { weatherData: any }) {
  const conditions = weatherData?.current_conditions || {}
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <Thermometer className="w-5 h-5 text-orange-400" />
        Current Conditions
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-400" />
            <span className="text-gray-400">Temperature</span>
            <span className="text-white font-medium ml-auto">
              {conditions.temperature || '--'}°C
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Wind className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">Wind Speed</span>
            <span className="text-white font-medium ml-auto">
              {conditions.wind_speed || '--'} km/h
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Droplets className="w-4 h-4 text-blue-400" />
            <span className="text-gray-400">Humidity</span>
            <span className="text-white font-medium ml-auto">
              {conditions.humidity || '--'}%
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span className="text-gray-400">Fire Index</span>
            <span className={cn(
              "font-medium ml-auto",
              (conditions.fire_weather_index || 0) > 0.7 ? "text-red-400" :
              (conditions.fire_weather_index || 0) > 0.4 ? "text-orange-400" :
              "text-green-400"
            )}>
              {((conditions.fire_weather_index || 0) * 100).toFixed(0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Risk Trend Chart
function RiskTrendChart({ riskHistory }: { riskHistory: any[] }) {
  const maxRisk = Math.max(...riskHistory.map(r => r.risk_level || 0), 1)
  
  return (
    <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-400" />
        Risk Trend (24h)
      </h3>
      
      <div className="h-32 flex items-end gap-1">
        {Array.from({ length: 24 }, (_, i) => {
          const dataPoint = riskHistory[i] || { risk_level: Math.random() * 0.8 }
          const height = (dataPoint.risk_level / maxRisk) * 100
          
          return (
            <motion.div
              key={i}
              className={cn(
                "flex-1 rounded-t",
                height > 70 ? "bg-red-500" :
                height > 40 ? "bg-orange-500" :
                "bg-green-500"
              )}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: i * 0.05 }}
              title={`Hour ${i}: ${(dataPoint.risk_level * 100).toFixed(0)}%`}
            />
          )
        })}
      </div>
      
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>24h ago</span>
        <span>Now</span>
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---
export function RealTimeStream({ onDataUpdate, className }: RealTimeStreamProps) {
  const [streamingData, setStreamingData] = useState<StreamingData[]>([])
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    latency: 0,
    reconnectAttempts: 0,
    lastPing: null
  })
  const [isStreaming, setIsStreaming] = useState(false)
  const [weatherData, setWeatherData] = useState<any>(null)
  const [riskHistory, setRiskHistory] = useState<any[]>([])
  
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Simulate WebSocket connection (since we don't have actual WebSocket endpoint yet)
  const simulateDataStream = () => {
    const interval = setInterval(() => {
      if (!isStreaming) return

      const newData: StreamingData = {
        timestamp: new Date().toISOString(),
        fire_updates: Array.from({ length: Math.floor(Math.random() * 3) }, () => ({
          id: Math.random().toString(36).substr(2, 9),
          latitude: 39.7 + (Math.random() - 0.5) * 2,
          longitude: -121.2 + (Math.random() - 0.5) * 2,
          intensity: Math.random(),
          confidence: 0.7 + Math.random() * 0.3
        })),
        weather_updates: [{
          condition: ['Clear', 'Cloudy', 'Windy', 'Dry'][Math.floor(Math.random() * 4)],
          temperature: 25 + Math.random() * 15,
          wind_speed: Math.random() * 30,
          humidity: 20 + Math.random() * 60
        }],
        risk_updates: [{
          level: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
          score: Math.random()
        }],
        quantum_features: {
          spatial_correlation: Math.random(),
          temporal_pattern: Math.random(),
          quantum_advantage: Math.random()
        }
      }

      setStreamingData(prev => [...prev.slice(-49), newData])
      
      // Update weather data
      if (newData.weather_updates.length > 0) {
        setWeatherData({
          current_conditions: {
            temperature: newData.weather_updates[0].temperature,
            wind_speed: newData.weather_updates[0].wind_speed,
            humidity: newData.weather_updates[0].humidity,
            fire_weather_index: Math.random()
          }
        })
      }

      // Update risk history
      if (newData.risk_updates.length > 0) {
        setRiskHistory(prev => [...prev.slice(-23), {
          timestamp: newData.timestamp,
          risk_level: newData.risk_updates[0].score
        }])
      }

      onDataUpdate?.(newData)
      
      // Update connection status
      setConnectionStatus(prev => ({
        ...prev,
        connected: true,
        latency: 50 + Math.random() * 100,
        lastPing: new Date()
      }))
    }, 2000) // Update every 2 seconds

    return interval
  }

  const startStreaming = () => {
    setIsStreaming(true)
    setConnectionStatus(prev => ({ ...prev, connected: true, reconnectAttempts: 0 }))
  }

  const stopStreaming = () => {
    setIsStreaming(false)
    setConnectionStatus(prev => ({ ...prev, connected: false }))
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isStreaming) {
      interval = simulateDataStream()
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isStreaming, onDataUpdate])

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Real-Time Data Stream</h2>
          <p className="text-gray-400">Live fire monitoring and quantum analysis</p>
        </div>
        
        <div className="flex items-center gap-4">
          <ConnectionStatusIndicator status={connectionStatus} />
          
          <button
            onClick={isStreaming ? stopStreaming : startStreaming}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors",
              isStreaming
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-green-600 hover:bg-green-700 text-white"
            )}
          >
            {isStreaming ? (
              <>
                <Pause className="w-4 h-4" />
                Stop Stream
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Start Stream
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stream Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Data Points</p>
              <p className="text-white text-xl font-bold">{streamingData.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Updates/Min</p>
              <p className="text-white text-xl font-bold">
                {isStreaming ? '30' : '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-gray-400 text-sm">Latency</p>
              <p className="text-white text-xl font-bold">
                {connectionStatus.latency.toFixed(0)}ms
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Live Data Feed */}
        <LiveDataFeed data={streamingData} />

        {/* Weather Conditions */}
        <WeatherConditionsWidget weatherData={weatherData} />
      </div>

      {/* Risk Trend Chart */}
      <RiskTrendChart riskHistory={riskHistory} />

      {/* Disconnection Alert */}
      <AnimatePresence>
        {!connectionStatus.connected && isStreaming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-900/50 border border-red-600 rounded-lg p-4"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <div>
                <h4 className="font-medium text-red-400">Connection Lost</h4>
                <p className="text-red-300 text-sm">
                  Attempting to reconnect... (Attempt {connectionStatus.reconnectAttempts})
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
