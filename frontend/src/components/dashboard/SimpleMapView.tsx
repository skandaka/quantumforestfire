'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Flame, Wind, MapPin } from 'lucide-react'

interface SimpleMapViewProps {
  fireData?: any
  predictionData?: any
  center?: [number, number]
  zoom?: number
  showEmberPrediction?: boolean
}

export default function SimpleMapView({
  fireData,
  predictionData,
  center = [-121.6219, 39.7596],
  zoom = 9,
  showEmberPrediction = false
}: SimpleMapViewProps) {
  const [mapReady, setMapReady] = useState(true)

  // Calculate map bounds
  const fires = fireData?.active_fires || []
  const minLat = fires.length > 0 ? Math.min(...fires.map((f: any) => f.center_lat || f.latitude)) : center[1] - 0.5
  const maxLat = fires.length > 0 ? Math.max(...fires.map((f: any) => f.center_lat || f.latitude)) : center[1] + 0.5
  const minLng = fires.length > 0 ? Math.min(...fires.map((f: any) => f.center_lon || f.longitude)) : center[0] - 0.5
  const maxLng = fires.length > 0 ? Math.max(...fires.map((f: any) => f.center_lon || f.longitude)) : center[0] + 0.5

  // Scale for positioning
  const latRange = maxLat - minLat || 1
  const lngRange = maxLng - minLng || 1

  const getFirePosition = (fire: any) => {
    const lat = fire.center_lat || fire.latitude
    const lng = fire.center_lon || fire.longitude
    
    const x = ((lng - minLng) / lngRange) * 100
    const y = ((maxLat - lat) / latRange) * 100
    
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) }
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity > 0.8) return '#ffffff' // White hot
    if (intensity > 0.6) return '#ffff00' // Yellow
    if (intensity > 0.4) return '#ff8c00' // Orange
    return '#ff4500' // Red
  }

  const getIntensitySize = (intensity: number, area: number) => {
    const baseSize = 8
    const intensityMultiplier = 1 + (intensity * 1.5)
    const areaMultiplier = Math.min(3, Math.sqrt(area / 100))
    return baseSize * intensityMultiplier * areaMultiplier
  }

  return (
    <div className="relative w-full h-full bg-gray-900 overflow-hidden">
      {/* Map Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-brown-800/30 to-gray-800/40">
        {/* Terrain Pattern */}
        <div className="absolute inset-0 opacity-20">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="terrain" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="#4a5568" opacity="0.3"/>
                <path d="M0,20 Q10,10 20,20 T40,20" stroke="#2d3748" strokeWidth="0.5" fill="none" opacity="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#terrain)"/>
          </svg>
        </div>
      </div>

      {/* Grid Lines */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          {/* Latitude lines */}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`lat-${i}`}
              x1="0"
              y1={`${i * 10}%`}
              x2="100%"
              y2={`${i * 10}%`}
              stroke="#fff"
              strokeWidth="0.5"
            />
          ))}
          {/* Longitude lines */}
          {Array.from({ length: 11 }, (_, i) => (
            <line
              key={`lng-${i}`}
              x1={`${i * 10}%`}
              y1="0"
              x2={`${i * 10}%`}
              y2="100%"
              stroke="#fff"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>

      {/* Fire Markers */}
      {fires.map((fire: any, index: number) => {
        const position = getFirePosition(fire)
        const intensity = fire.intensity || 0.5
        const area = fire.area_hectares || 100
        const size = getIntensitySize(intensity, area)
        const color = getIntensityColor(intensity)

        return (
          <div
            key={fire.id || index}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
            }}
          >
            {/* Fire glow effect */}
            <div
              className="absolute rounded-full opacity-60 animate-pulse"
              style={{
                width: `${size * 2}px`,
                height: `${size * 2}px`,
                backgroundColor: color,
                filter: 'blur(8px)',
                transform: 'translate(-50%, -50%)',
              }}
            />
            
            {/* Fire core */}
            <div
              className="relative rounded-full border-2 border-red-500"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                backgroundColor: color,
                boxShadow: `0 0 ${size}px rgba(255, 0, 0, 0.8)`,
              }}
            />

            {/* Fire info popup */}
            <div className="absolute left-full top-0 ml-2 bg-black/90 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
              <div className="font-bold text-orange-400">Fire #{index + 1}</div>
              <div>Intensity: {(intensity * 100).toFixed(0)}%</div>
              <div>Area: {area.toFixed(0)} hectares</div>
              <div>Confidence: {((fire.confidence || 0.8) * 100).toFixed(0)}%</div>
              <div className="text-gray-400 text-xs">
                {(fire.center_lat || fire.latitude)?.toFixed(4)}°, {(fire.center_lon || fire.longitude)?.toFixed(4)}°
              </div>
              {fire.detection_time && (
                <div className="text-gray-400 text-xs">
                  {new Date(fire.detection_time).toLocaleTimeString()}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Prediction overlay */}
      {showEmberPrediction && predictionData?.predictions?.[0]?.high_risk_cells && (
        <>
          {predictionData.predictions[0].high_risk_cells.map((cell: [number, number], index: number) => {
            const [gridX, gridY] = cell
            const x = (gridX / 50) * 100
            const y = (gridY / 50) * 100

            return (
              <div
                key={`prediction-${index}`}
                className="absolute w-2 h-2 bg-yellow-400 border border-yellow-500 rounded-full opacity-60 animate-pulse"
                style={{
                  left: `${Math.max(0, Math.min(98, x))}%`,
                  top: `${Math.max(0, Math.min(98, y))}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            )
          })}
        </>
      )}

      {/* Map Controls */}
      <div className="absolute top-4 right-4 space-y-2">
        <button 
          className="bg-black/80 text-white p-2 rounded hover:bg-black/90 transition-colors"
          onClick={() => window.open(`https://www.google.com/maps/@${center[1]},${center[0]},${zoom}z`, '_blank')}
        >
          <MapPin className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur rounded-lg p-3 text-white text-sm max-w-xs">
        <h4 className="font-semibold mb-2 flex items-center gap-2">
          <Flame className="w-4 h-4" />
          Fire Intensity
        </h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Low (0-40%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Medium (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>High (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-white rounded-full"></div>
            <span>Extreme (80%+)</span>
          </div>
          {showEmberPrediction && (
            <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <span>Ember Risk</span>
            </div>
          )}
        </div>
        
        {fires.length > 0 && (
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="text-xs text-gray-400">
              Coverage: {(latRange * 111).toFixed(1)} × {(lngRange * 111 * Math.cos(center[1] * Math.PI / 180)).toFixed(1)} km
            </div>
            <div className="text-xs text-gray-400">
              Center: {center[1].toFixed(4)}°, {center[0].toFixed(4)}°
            </div>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 bg-black/90 rounded-lg p-2 text-white text-sm">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span>Live Map View</span>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          {fires.length} active fire{fires.length !== 1 ? 's' : ''} detected
        </div>
      </div>
    </div>
  )
}
