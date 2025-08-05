'use client'

import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// Set Mapbox token
if (process.env.NEXT_PUBLIC_MAPBOX_TOKEN) {
  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
}

// Validate and fix coordinates for Mapbox (longitude, latitude format)
function validateCoordinates(coords: [number, number]): [number, number] {
  if (!coords || coords.length !== 2) {
    return [-120.0, 38.0] // Default to California
  }
  
  const [lng, lat] = coords
  
  // Check if coordinates are valid
  if (typeof lng !== 'number' || typeof lat !== 'number' || 
      isNaN(lng) || isNaN(lat) ||
      lat < -90 || lat > 90 || 
      lng < -180 || lng > 180) {
    console.warn('Invalid coordinates provided:', coords, 'Using default coordinates')
    return [-120.0, 38.0] // Default to California
  }
  
  return [lng, lat]
}

interface MapViewProps {
  fireData?: any
  predictionData?: {
    heatmap_data?: {
      type: 'FeatureCollection'
      features: Array<{
        type: 'Feature'
        geometry: {
          type: 'Point'
          coordinates: [number, number]
        }
        properties: {
          mag: number
          time_step: number
          risk_level: string
        }
      }>
    }
    predictions?: Array<{
      ember_prediction_area?: any
    }>
  }
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

    // Validate coordinates
    const validCenter = validateCoordinates(center)
    
    // Initialize map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: validCenter,
      zoom: zoom
    })

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right')

    // Add fire data markers
    if (fireData?.active_fires) {
      fireData.active_fires.forEach((fire: any) => {
        // Validate fire coordinates
        const fireLng = fire.center_lon || fire.longitude
        const fireLat = fire.center_lat || fire.latitude
        
        if (typeof fireLng !== 'number' || typeof fireLat !== 'number' || 
            isNaN(fireLng) || isNaN(fireLat) ||
            fireLat < -90 || fireLat > 90 || 
            fireLng < -180 || fireLng > 180) {
          console.warn('Invalid fire coordinates:', { fireLng, fireLat })
          return // Skip this fire marker
        }

        const el = document.createElement('div')
        el.className = 'fire-marker'
        el.style.width = '20px'
        el.style.height = '20px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#ff0000'
        el.style.opacity = '0.8'
        el.style.boxShadow = '0 0 10px rgba(255, 0, 0, 0.8)'

        new mapboxgl.Marker(el)
          .setLngLat([fireLng, fireLat])
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

  // Update heatmap when prediction data changes
  useEffect(() => {
    if (!map.current || !predictionData?.heatmap_data) return

    const addHeatmapLayer = () => {
      try {
        // Remove existing heatmap layers
        if (map.current!.getLayer('heatmap-layer')) {
          map.current!.removeLayer('heatmap-layer')
        }
        if (map.current!.getLayer('heatmap-points')) {
          map.current!.removeLayer('heatmap-points')
        }
        if (map.current!.getSource('heatmap-source')) {
          map.current!.removeSource('heatmap-source')
        }

        // Validate heatmap data structure
        if (!predictionData.heatmap_data?.features || !Array.isArray(predictionData.heatmap_data.features)) {
          console.warn('Invalid heatmap data structure')
          return
        }

        // Filter out invalid coordinates
        const validFeatures = predictionData.heatmap_data.features.filter((feature: any) => {
          if (!feature.geometry?.coordinates || !Array.isArray(feature.geometry.coordinates)) {
            return false
          }
          const [lng, lat] = feature.geometry.coordinates
          return typeof lng === 'number' && typeof lat === 'number' &&
                 !isNaN(lng) && !isNaN(lat) &&
                 lat >= -90 && lat <= 90 &&
                 lng >= -180 && lng <= 180
        })

        const validHeatmapData = {
          type: 'FeatureCollection' as const,
          features: validFeatures
        }

        // Add heatmap source
        map.current!.addSource('heatmap-source', {
          type: 'geojson',
          data: validHeatmapData
        })

        // Add heatmap layer
        map.current!.addLayer({
          id: 'heatmap-layer',
          type: 'heatmap',
          source: 'heatmap-source',
          maxzoom: 15,
          paint: {
            'heatmap-weight': [
              'interpolate',
              ['linear'],
              ['get', 'mag'],
              0, 0,
              1, 1
            ],
            'heatmap-intensity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 1,
              15, 3
            ],
            'heatmap-color': [
              'interpolate',
              ['linear'],
              ['heatmap-density'],
              0, 'rgba(33,102,172,0)',
              0.2, 'rgb(103,169,207)',
              0.4, 'rgb(209,229,240)',
              0.6, 'rgb(253,219,199)',
              0.8, 'rgb(239,138,98)',
              1, 'rgb(178,24,43)'
            ],
            'heatmap-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 2,
              15, 20
            ],
            'heatmap-opacity': [
              'interpolate',
              ['linear'],
              ['zoom'],
              7, 1,
              15, 0
            ]
          }
        })

        // Add circle layer for high zoom levels
        map.current!.addLayer({
          id: 'heatmap-points',
          type: 'circle',
          source: 'heatmap-source',
          minzoom: 14,
          paint: {
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['get', 'mag'],
              0, 1,
              1, 10
            ],
            'circle-color': [
              'case',
              ['==', ['get', 'risk_level'], 'extreme'], '#b71c1c',
              ['==', ['get', 'risk_level'], 'high'], '#f57c00',
              ['==', ['get', 'risk_level'], 'medium'], '#ffa000',
              '#ffeb3b'
            ],
            'circle-opacity': 0.8,
            'circle-stroke-color': 'white',
            'circle-stroke-width': 1
          }
        })
      } catch (error) {
        console.error('Error adding heatmap layer:', error)
      }
    }

    // Wait for map to load before adding layers
    if (map.current.isStyleLoaded()) {
      addHeatmapLayer()
    } else {
      map.current.on('load', addHeatmapLayer)
    }

    return () => {
      map.current?.off('load', addHeatmapLayer)
    }
  }, [predictionData])

  // Add ember prediction area if showEmberPrediction is true
  useEffect(() => {
    if (!map.current || !showEmberPrediction || !predictionData?.predictions?.[0]?.ember_prediction_area) return

    const emberArea = predictionData.predictions[0].ember_prediction_area

    const addEmberLayer = () => {
      try {
        // Remove existing ember layer
        if (map.current!.getLayer('ember-prediction-layer')) {
          map.current!.removeLayer('ember-prediction-layer')
        }
        if (map.current!.getSource('ember-prediction-source')) {
          map.current!.removeSource('ember-prediction-source')
        }

        // Add ember prediction area
        map.current!.addSource('ember-prediction-source', {
          type: 'geojson',
          data: emberArea
        })

        map.current!.addLayer({
          id: 'ember-prediction-layer',
          type: 'fill',
          source: 'ember-prediction-source',
          paint: {
            'fill-color': '#ff6b35',
            'fill-opacity': 0.3,
            'fill-outline-color': '#ff6b35'
          }
        })
      } catch (error) {
        console.error('Error adding ember layer:', error)
      }
    }

    if (map.current.isStyleLoaded()) {
      addEmberLayer()
    } else {
      map.current.on('load', addEmberLayer)
    }

    return () => {
      map.current?.off('load', addEmberLayer)
    }
  }, [showEmberPrediction, predictionData])

  return (
    <div ref={mapContainer} className="w-full h-full" />
  )
}