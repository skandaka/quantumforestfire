'use client'

import { useEffect, useRef, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

interface MapViewProps {
  fireData?: any
  predictionData?: any
  center?: [number, number]
  zoom?: number
  showEmberPrediction?: boolean
}

export default function MapView({
                                  fireData,
                                  predictionData,
                                  center = [-120.0, 39.0], // Safe California coordinates
                                  zoom = 6,
                                  showEmberPrediction = false
                                }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const [mapError, setMapError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Validate coordinates
  const validateCoords = (coords: [number, number]): [number, number] => {
    let [lng, lat] = coords

    // Ensure latitude is between -90 and 90
    lat = Math.max(-90, Math.min(90, lat))

    // Ensure longitude is between -180 and 180
    lng = ((lng + 180) % 360) - 180

    return [lng, lat]
  }

  const safeCenter = validateCoords(center)

  useEffect(() => {
    if (!mapContainer.current) return

    // Check if we have Mapbox token
    if (!process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
      setMapError('Mapbox token not configured')
      setIsLoading(false)
      return
    }

    let map: any = null

    const initializeMap = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const mapboxgl = (await import('mapbox-gl')).default

        mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

        map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/dark-v11',
          center: safeCenter,
          zoom: zoom,
          maxZoom: 18,
          minZoom: 3
        })

        // Add navigation controls
        map.addControl(new mapboxgl.NavigationControl(), 'top-right')

        map.on('load', () => {
          setIsLoading(false)
          addFireMarkers(map, fireData)
          addPredictionLayer(map, predictionData)
        })

        map.on('error', (e: any) => {
          console.error('Map error:', e)
          setMapError('Failed to load map')
          setIsLoading(false)
        })

      } catch (error) {
        console.error('Failed to initialize map:', error)
        setMapError('Failed to initialize map')
        setIsLoading(false)
      }
    }

    initializeMap()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [safeCenter[0], safeCenter[1], zoom])

  const addFireMarkers = (map: any, fireData: any) => {
    if (!fireData?.active_fires || !Array.isArray(fireData.active_fires)) return

    fireData.active_fires.forEach((fire: any, index: number) => {
      try {
        // Validate fire coordinates
        const lat = parseFloat(fire.center_lat || fire.latitude || 0)
        const lng = parseFloat(fire.center_lon || fire.longitude || 0)

        // Skip invalid coordinates
        if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.warn('Invalid fire coordinates:', { lat, lng })
          return
        }

        const validCoords = validateCoords([lng, lat])

        // Create fire marker
        const el = document.createElement('div')
        const intensity = fire.intensity || 0.5
        const size = Math.max(12, Math.min(24, (fire.area_hectares || 10) / 10))

        el.className = 'fire-marker'
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.borderRadius = '50%'
        el.style.background = `radial-gradient(circle, 
          ${intensity > 0.8 ? '#ffffff' :
            intensity > 0.6 ? '#ffff00' :
                intensity > 0.4 ? '#ff8c00' : '#ff4500'} 0%, 
          #ff0000 70%)`
        el.style.border = '2px solid #ff0000'
        el.style.opacity = '0.9'
        el.style.boxShadow = '0 0 15px rgba(255, 0, 0, 0.8)'
        el.style.cursor = 'pointer'

        // Add popup
        const popup = new (window as any).mapboxgl.Popup({ offset: 25 })
            .setHTML(`
            <div class="fire-popup">
              <h3 style="color: #ff4500; margin: 0 0 8px 0;">Active Fire ${index + 1}</h3>
              <p style="margin: 4px 0;"><strong>Intensity:</strong> ${(intensity * 100).toFixed(0)}%</p>
              <p style="margin: 4px 0;"><strong>Area:</strong> ${fire.area_hectares || 'Unknown'} hectares</p>
              <p style="margin: 4px 0;"><strong>Confidence:</strong> ${((fire.confidence || 0.8) * 100).toFixed(0)}%</p>
              <p style="margin: 4px 0; font-size: 12px; color: #666;">
                ${validCoords[1].toFixed(4)}°, ${validCoords[0].toFixed(4)}°
              </p>
            </div>
          `)

        new (window as any).mapboxgl.Marker(el)
            .setLngLat(validCoords)
            .setPopup(popup)
            .addTo(map)

      } catch (error) {
        console.error('Error adding fire marker:', error)
      }
    })
  }

  const addPredictionLayer = (map: any, predictionData: any) => {
    if (!predictionData || !showEmberPrediction) return

    // Add prediction visualization if available
    if (predictionData.predictions && predictionData.predictions.length > 0) {
      const prediction = predictionData.predictions[0]

      if (prediction.high_risk_cells && prediction.high_risk_cells.length > 0) {
        prediction.high_risk_cells.forEach((cell: [number, number], index: number) => {
          const [gridX, gridY] = cell

          // Convert grid coordinates to geographic coordinates (simplified)
          const lat = safeCenter[1] + (gridY - 25) * 0.01
          const lng = safeCenter[0] + (gridX - 25) * 0.01

          const validCoords = validateCoords([lng, lat])

          const el = document.createElement('div')
          el.style.width = '10px'
          el.style.height = '10px'
          el.style.backgroundColor = 'rgba(255, 255, 0, 0.6)'
          el.style.border = '1px solid #ffff00'
          el.style.borderRadius = '50%'

          new (window as any).mapboxgl.Marker(el)
              .setLngLat(validCoords)
              .addTo(map)
        })
      }
    }
  }

  if (mapError) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <p className="text-lg mb-2">Map Error</p>
            <p className="text-sm text-gray-400">{mapError}</p>
            <div className="mt-4 p-4 bg-gray-800 rounded-lg text-left text-sm">
              <p><strong>To fix this:</strong></p>
              <p>1. Get a Mapbox token from <a href="https://mapbox.com" target="_blank" className="text-blue-400">mapbox.com</a></p>
              <p>2. Add it to <code>frontend/.env.local</code>:</p>
              <p><code>NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here</code></p>
            </div>
          </div>
        </div>
    )
  }

  return (
      <div className="relative w-full h-full">
        {isLoading && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10">
              <div className="text-white text-center">
                <div className="spinner w-8 h-8 mx-auto mb-4"></div>
                <p>Loading map...</p>
              </div>
            </div>
        )}

        <div
            ref={mapContainer}
            className="w-full h-full"
            style={{ minHeight: '400px' }}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur rounded-lg p-3 text-white text-sm">
          <h4 className="font-semibold mb-2">Fire Intensity</h4>
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
          </div>
        </div>
      </div>
  )
}