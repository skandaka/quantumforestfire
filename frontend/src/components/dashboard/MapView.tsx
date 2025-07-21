'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox token
if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
}

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
  center = [-120.0, 38.0], // Default to California
  zoom = 6,
  showEmberPrediction = false
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current || !process.env.NEXT_PUBLIC_MAPBOX_TOKEN) return

    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: center,
      zoom: zoom
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add fire data markers
    if (fireData?.active_fires) {
      fireData.active_fires.forEach((fire: any) => {
        const el = document.createElement('div')
        el.className = 'fire-marker'
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#ff0000'
        el.style.opacity = '0.8'
        el.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)'

        new mapboxgl.Marker(el)
          .setLngLat([fire.center_lon || fire.longitude, fire.center_lat || fire.latitude])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`
                <div>
                  <h3 class="font-bold">Active Fire</h3>
                  <p>Intensity: ${(fire.intensity * 100).toFixed(0)}%</p>
                  <p>Area: ${fire.area_hectares} ha</p>
                </div>
              `)
          )
          .addTo(map.current!)
      })
    }

    return () => {
      map.current?.remove()
    }
  }, [center, zoom, fireData])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
}