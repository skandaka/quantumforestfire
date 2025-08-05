'use client'

import React, { useEffect, useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Flame, Wind, Thermometer, Droplets, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
export interface FireDataPoint {
  id: string
  latitude: number
  longitude: number
  intensity: number // 0-1
  temperature: number // Celsius
  area: number // hectares
  confidence: number // 0-100%
  timestamp: string
  source: 'NASA_FIRMS' | 'CAL_FIRE' | 'NOAA'
  type: 'active' | 'predicted' | 'historical'
}

export interface WeatherData {
  latitude: number
  longitude: number
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number // degrees
  pressure: number
}

export interface HeatmapCell {
  latitude: number
  longitude: number
  riskLevel: number // 0-1
  factors: {
    vegetation: number
    weather: number
    topography: number
    human: number
  }
}

interface FireMapProps {
  fires: FireDataPoint[]
  weatherStations?: WeatherData[]
  heatmapData?: HeatmapCell[]
  center?: [number, number]
  zoom?: number
  showHeatmap?: boolean
  showWeather?: boolean
  showEmberPrediction?: boolean
  onFireClick?: (fire: FireDataPoint) => void
  className?: string
  interactive?: boolean
  timeRange?: [Date, Date]
}

// --- UTILITY FUNCTIONS ---
const getFireColor = (intensity: number, temperature: number): string => {
  if (intensity > 0.8 || temperature > 1000) return '#ffffff' // White hot
  if (intensity > 0.6 || temperature > 600) return '#ffff00' // Yellow
  if (intensity > 0.4 || temperature > 400) return '#ff8c00' // Orange
  if (intensity > 0.2 || temperature > 200) return '#ff4500' // Red-orange
  return '#ff0000' // Red
}

const getFireSize = (area: number, intensity: number): number => {
  const baseSize = 8
  const areaMultiplier = Math.min(3, Math.sqrt(area / 100))
  const intensityMultiplier = 1 + (intensity * 1.5)
  return baseSize * areaMultiplier * intensityMultiplier
}

const getRiskColor = (riskLevel: number): string => {
  if (riskLevel > 0.8) return 'rgba(255, 0, 0, 0.6)'
  if (riskLevel > 0.6) return 'rgba(255, 100, 0, 0.5)'
  if (riskLevel > 0.4) return 'rgba(255, 200, 0, 0.4)'
  if (riskLevel > 0.2) return 'rgba(255, 255, 0, 0.3)'
  return 'rgba(0, 255, 0, 0.2)'
}

// --- MAIN COMPONENT ---
export function FireMap({
  fires,
  weatherStations = [],
  heatmapData = [],
  center = [-121.6219, 39.7596], // Default to Paradise, CA
  zoom = 10,
  showHeatmap = true,
  showWeather = true,
  showEmberPrediction = false,
  onFireClick,
  className,
  interactive = true,
  timeRange
}: FireMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [mapBounds, setMapBounds] = useState({ width: 800, height: 600 })
  const [selectedFire, setSelectedFire] = useState<FireDataPoint | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time for animations
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  // Calculate map bounds
  const bounds = useMemo(() => {
    if (fires.length === 0) {
      return {
        minLat: center[1] - 0.1,
        maxLat: center[1] + 0.1,
        minLng: center[0] - 0.1,
        maxLng: center[0] + 0.1
      }
    }

    const lats = fires.map(f => f.latitude)
    const lngs = fires.map(f => f.longitude)
    
    return {
      minLat: Math.min(...lats) - 0.05,
      maxLat: Math.max(...lats) + 0.05,
      minLng: Math.min(...lngs) - 0.05,
      maxLng: Math.max(...lngs) + 0.05
    }
  }, [fires, center])

  // Convert lat/lng to pixel coordinates
  const coordToPixel = (lat: number, lng: number) => {
    const x = ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * mapBounds.width
    const y = ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * mapBounds.height
    return { x: Math.max(0, Math.min(mapBounds.width, x)), y: Math.max(0, Math.min(mapBounds.height, y)) }
  }

  // Filter fires by time range if provided
  const filteredFires = useMemo(() => {
    if (!timeRange) return fires
    return fires.filter(fire => {
      const fireTime = new Date(fire.timestamp)
      return fireTime >= timeRange[0] && fireTime <= timeRange[1]
    })
  }, [fires, timeRange])

  // Handle fire click
  const handleFireClick = (fire: FireDataPoint) => {
    setSelectedFire(fire)
    onFireClick?.(fire)
  }

  // Resize handler
  useEffect(() => {
    const updateSize = () => {
      if (mapRef.current) {
        const rect = mapRef.current.getBoundingClientRect()
        setMapBounds({ width: rect.width, height: rect.height })
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  return (
    <div 
      ref={mapRef}
      className={cn(
        "relative w-full h-full bg-gradient-to-br from-green-900/20 via-brown-800/30 to-gray-800/40",
        "overflow-hidden rounded-lg border border-gray-700",
        interactive && "cursor-crosshair",
        className
      )}
    >
      {/* Background Terrain */}
      <div className="absolute inset-0 opacity-30">
        <div className="w-full h-full bg-gradient-to-br from-green-800/40 via-yellow-800/30 to-brown-800/40" />
        {/* Terrain lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="terrain" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M0,25 Q12.5,15 25,25 T50,25" stroke="#4ade80" strokeWidth="1" fill="none" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#terrain)" />
        </svg>
      </div>

      {/* Heatmap Layer */}
      {showHeatmap && heatmapData.length > 0 && (
        <div className="absolute inset-0">
          {heatmapData.map((cell, index) => {
            const position = coordToPixel(cell.latitude, cell.longitude)
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute"
                style={{
                  left: position.x - 15,
                  top: position.y - 15,
                  width: 30,
                  height: 30,
                  backgroundColor: getRiskColor(cell.riskLevel),
                  borderRadius: '50%',
                  filter: 'blur(8px)'
                }}
              />
            )
          })}
        </div>
      )}

      {/* Weather Stations */}
      {showWeather && weatherStations.map((station, index) => {
        const position = coordToPixel(station.latitude, station.longitude)
        return (
          <motion.div
            key={`weather-${index}`}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="absolute z-20 group"
            style={{ left: position.x - 8, top: position.y - 8 }}
          >
            <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
              <div className="flex items-center gap-1">
                <Thermometer className="w-3 h-3" />
                {station.temperature}°C
              </div>
              <div className="flex items-center gap-1">
                <Wind className="w-3 h-3" />
                {station.windSpeed} mph {station.windDirection}°
              </div>
              <div className="flex items-center gap-1">
                <Droplets className="w-3 h-3" />
                {station.humidity}%
              </div>
            </div>
          </motion.div>
        )
      })}

      {/* Fire Points */}
      {filteredFires.map((fire, index) => {
        const position = coordToPixel(fire.latitude, fire.longitude)
        const size = getFireSize(fire.area, fire.intensity)
        const color = getFireColor(fire.intensity, fire.temperature)
        const isSelected = selectedFire?.id === fire.id

        return (
          <motion.div
            key={fire.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: fire.type === 'active' ? [
                `0 0 ${size}px ${color}`,
                `0 0 ${size * 2}px ${color}40`
              ] : undefined
            }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "absolute z-30 rounded-full cursor-pointer",
              "transition-all duration-300 hover:scale-110",
              isSelected && "ring-4 ring-yellow-400"
            )}
            style={{
              left: position.x - size / 2,
              top: position.y - size / 2,
              width: size,
              height: size,
              backgroundColor: color,
              border: `2px solid ${fire.confidence > 80 ? '#ffffff' : '#cccccc'}`
            }}
            onClick={() => handleFireClick(fire)}
          >
            {/* Pulsing animation for active fires */}
            {fire.type === 'active' && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white"
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
            
            {/* Fire icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Flame className={cn(
                "text-white drop-shadow-lg",
                size > 16 ? "w-4 h-4" : "w-2 h-2"
              )} />
            </div>
          </motion.div>
        )
      })}

      {/* Ember Prediction Trails */}
      {showEmberPrediction && filteredFires.map((fire, index) => {
        if (fire.type !== 'active') return null
        
        const startPos = coordToPixel(fire.latitude, fire.longitude)
        const windEffect = weatherStations[0] // Use first weather station for demo
        
        if (!windEffect) return null
        
        // Calculate ember trajectory based on wind
        const emberTrails = Array.from({ length: 5 }, (_, i) => {
          const angle = (windEffect.windDirection + (i - 2) * 15) * Math.PI / 180
          const distance = windEffect.windSpeed * 2 // Simplified calculation
          const endX = startPos.x + Math.cos(angle) * distance
          const endY = startPos.y - Math.sin(angle) * distance
          
          return { startPos, endX, endY, delay: i * 0.2 }
        })

        return (
          <g key={`ember-${fire.id}`}>
            {emberTrails.map((trail, i) => (
              <motion.line
                key={i}
                x1={trail.startPos.x}
                y1={trail.startPos.y}
                x2={trail.endX}
                y2={trail.endY}
                stroke="#ff6b35"
                strokeWidth="2"
                strokeDasharray="5,5"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.7 }}
                transition={{ duration: 1.5, delay: trail.delay }}
              />
            ))}
          </g>
        )
      })}

      {/* Grid Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#ffffff" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur rounded-lg p-3 text-white text-sm max-w-xs">
        <h3 className="font-semibold mb-2">Fire Risk Map</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <span>Active Fires</span>
          </div>
          {showHeatmap && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-red-500 rounded-full" />
              <span>Risk Levels</span>
            </div>
          )}
          {showWeather && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Weather Stations</span>
            </div>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-400">
          {filteredFires.length} active fires • Updated {currentTime.toLocaleTimeString()}
        </div>
      </div>

      {/* Fire Details Panel */}
      {selectedFire && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 bg-black/90 backdrop-blur rounded-lg p-4 text-white max-w-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              Fire Details
            </h3>
            <button 
              onClick={() => setSelectedFire(null)}
              className="text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Intensity:</span>
              <span className="font-medium">{(selectedFire.intensity * 100).toFixed(1)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Temperature:</span>
              <span className="font-medium">{selectedFire.temperature}°C</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Area:</span>
              <span className="font-medium">{selectedFire.area.toFixed(1)} hectares</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Confidence:</span>
              <span className="font-medium">{selectedFire.confidence}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Source:</span>
              <span className="font-medium">{selectedFire.source}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Type:</span>
              <span className={cn(
                "font-medium capitalize",
                selectedFire.type === 'active' && "text-red-400",
                selectedFire.type === 'predicted' && "text-yellow-400",
                selectedFire.type === 'historical' && "text-gray-400"
              )}>
                {selectedFire.type}
              </span>
            </div>
          </div>
          
          {selectedFire.type === 'active' && (
            <div className="mt-3 p-2 bg-red-900/50 rounded border border-red-700">
              <div className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-xs font-medium">ACTIVE FIRE ALERT</span>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Status Indicator */}
      <div className="absolute top-4 left-4 bg-black/90 rounded-lg p-2 text-white text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Real-time</span>
        </div>
      </div>
    </div>
  )
}

export default FireMap