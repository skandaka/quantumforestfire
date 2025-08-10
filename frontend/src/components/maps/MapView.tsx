'use client'

import React, {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
} from 'react'
import Map, {
    Source,
    Layer,
    Popup,
    NavigationControl,
    FullscreenControl,
    ScaleControl,
    MapRef
} from 'react-map-gl'
import type { Feature, FeatureCollection, Point, Polygon, GeoJsonProperties } from 'geojson'
import {
    Flame,
    Wind,
    Thermometer,
    Cloud,
    Eye,
    X,
    Layers
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LngLatBoundsLike, LngLatBounds } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// --- TYPE DEFINITIONS ---
interface PopupInfo {
    longitude: number
    latitude: number
    data: Record<string, any>
    type: 'fire' | 'weather' | 'risk_area' | 'prediction'
}

interface MapViewProps {
    predictionData?: any
    realtimeData?: {
        activeFires: any[]
        weatherStations: any[]
        highRiskAreas: any[]
    }
    center?: [number, number]
    zoom?: number
    interactive?: boolean
    style?: React.CSSProperties
}

// --- CONSTANTS AND CONFIGURATIONS ---
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const HEATMAP_LAYER: any = {
    id: 'fire-prediction-heatmap',
    type: 'heatmap',
    source: 'prediction-source',
    maxzoom: 15,
    paint: {
        'heatmap-weight': [
            'interpolate',
            ['linear'],
            ['get', 'mag'],
            0, 0,
            1, 0.2,
            5, 0.6,
            10, 1
        ],
        'heatmap-intensity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 1,
            15, 4
        ],
        // Boost low-end visibility & smoother ramp
        'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0.0, 'rgba(13,71,161,0)',
            0.02, 'rgba(13,71,161,0.25)',
            0.08, 'rgba(25,118,210,0.55)',
            0.18, 'rgba(38,198,218,0.65)',
            0.32, 'rgba(67,160,71,0.75)',
            0.48, 'rgba(253,216,53,0.85)',
            0.66, 'rgba(251,140,0,0.9)',
            0.82, 'rgba(229,57,53,0.95)',
            1.0, 'rgba(183,28,28,1)'
        ],
        'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            6, 28,
            10, 48,
            14, 84
        ],
        'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 0.95,
            14, 0.45
        ]
    }
}

// Additional circle layer to make individual prediction points clickable & more visible
const PREDICTION_POINTS_LAYER: any = {
    id: 'prediction-points',
    type: 'circle',
    source: 'prediction-source',
    minzoom: 5,
    paint: {
        'circle-radius': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, 2.2,
            0.2, 4,
            0.4, 5.5,
            0.6, 7,
            0.8, 8,
            1, 9.5
        ],
        'circle-color': [
            'interpolate', ['linear'], ['get', 'mag'],
            0, '#0d47a1',
            0.2, '#1976d2',
            0.4, '#26c6da',
            0.6, '#fdd835',
            0.8, '#fb8c00',
            1, '#e53935'
        ],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 0.6,
        'circle-opacity': 0.7
    }
}

const ACTIVE_FIRES_LAYER: any = {
    id: 'active-fires-points',
    type: 'symbol',
    source: 'active-fires-source',
    layout: {
        'icon-image': 'fire-station-15',
        'icon-size': 1.5,
        'icon-allow-overlap': true,
    },
    paint: {
        'icon-color': '#ff4d4d',
        'icon-halo-color': '#fff',
        'icon-halo-width': 1
    }
}

const WEATHER_STATIONS_LAYER: any = {
    id: 'weather-stations-points',
    type: 'circle',
    source: 'weather-stations-source',
    paint: {
        'circle-radius': 6,
        'circle-color': '#3399ff',
        'circle-stroke-color': 'white',
        'circle-stroke-width': 1.5
    }
}

const HIGH_RISK_AREA_LAYER: any = {
    id: 'high-risk-area-polygons',
    type: 'fill',
    source: 'high-risk-areas-source',
    paint: {
        'fill-color': [
            'interpolate',
            ['linear'],
            ['get', 'risk_level'],
            0, 'rgba(255,140,0,0.05)',
            0.3, 'rgba(255,140,0,0.15)',
            0.6, 'rgba(255,99,0,0.35)',
            0.8, 'rgba(255,69,0,0.45)',
            1, 'rgba(255,0,0,0.55)'
        ],
        'fill-opacity': 0.5,
        'fill-outline-color': 'rgba(255,140,0,0.8)'
    }
}

const ACTIVE_FIRE_INTENSITY_HEATMAP: any = {
    id: 'active-fire-intensity-heatmap',
    type: 'heatmap',
    source: 'active-fires-heatmap-source',
    maxzoom: 16,
    paint: {
        'heatmap-weight': [
            'interpolate', ['linear'], ['get', 'intensity'],
            0, 0,
            0.25, 0.2,
            0.5, 0.5,
            0.75, 0.8,
            1, 1
        ],
        'heatmap-intensity': [
            'interpolate', ['linear'], ['zoom'],
            6, 0.6,
            10, 1.2,
            14, 2.2
        ],
        'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,0,0,0)',
            0.1, 'rgba(0,0,128,0.3)',
            0.3, 'rgba(0,128,255,0.45)',
            0.5, 'rgba(0,255,128,0.55)',
            0.7, 'rgba(255,255,0,0.65)',
            0.85, 'rgba(255,128,0,0.75)',
            1, 'rgba(255,0,0,0.85)'
        ],
        'heatmap-radius': [
            'interpolate', ['linear'], ['zoom'],
            6, 10,
            8, 18,
            10, 30,
            14, 55
        ],
        'heatmap-opacity': [
            'interpolate', ['linear'], ['zoom'],
            6, 0.7,
            14, 0.3
        ]
    }
}

// Build 3D extrusion polygons from probability grid
function buildProbabilityExtrusions(probMap: number[][], center: { latitude: number; longitude: number }) {
    const rows = probMap.length
    if (!rows) return null
    const cols = probMap[0].length
    const sizeDeg = 0.5
    const cellLat = sizeDeg / rows
    const cellLon = sizeDeg / cols
    const features: any[] = []
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const p = probMap[r][c]
            if (p < 0.1) continue
            const lat0 = center.latitude - sizeDeg / 2 + r * cellLat
            const lon0 = center.longitude - sizeDeg / 2 + c * cellLon
            const lat1 = lat0 + cellLat
            const lon1 = lon0 + cellLon
            features.push({
                type: 'Feature',
                geometry: { type: 'Polygon', coordinates: [[ [lon0, lat0], [lon1, lat0], [lon1, lat1], [lon0, lat1], [lon0, lat0] ]] },
                properties: { value: p, height: Math.max(5, p * 4000) }
            })
        }
    }
    return { type: 'FeatureCollection', features }
}

const PROB_EXTRUSION_LAYER: any = {
    id: 'probability-extrusions',
    type: 'fill-extrusion',
    source: 'probability-extrusions-source',
    minzoom: 8,
    paint: {
        'fill-extrusion-color': [
            'interpolate', ['linear'], ['get', 'value'],
            0.1, '#1976d2',
            0.3, '#26c6da',
            0.5, '#ffeb3b',
            0.7, '#fb8c00',
            0.9, '#e53935'
        ],
        'fill-extrusion-height': ['get', 'height'],
        'fill-extrusion-opacity': 0.75,
        'fill-extrusion-base': 0
    }
}

const CONTOUR_LAYER: any = {
    id: 'prediction-contours',
    type: 'line',
    source: 'probability-extrusions-source',
    paint: { 'line-color': '#ffffff', 'line-opacity': 0.25, 'line-width': 1 }
}

export function MapView({
                            predictionData,
                            realtimeData,
                            center = [-121.6, 39.7],
                            zoom = 8,
                            interactive = true,
                            style
                        }: MapViewProps) {
    const mapRef = useRef<MapRef>(null)
    const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null)
    const [isStyleLoaded, setIsStyleLoaded] = useState(false)
        const [visibleLayers, setVisibleLayers] = useState({
            heatmap: true,
            probability3D: false,
            contours: false,
            activeFireIntensity: true,
            activeFires: true,
            highRiskAreas: false,
            weatherStations: false,
        })
    const [isControlsOpen, setControlsOpen] = useState(true)

    // --- DATA TRANSFORMATION (MEMOIZED) ---

    const heatmapSource = useMemo((): FeatureCollection<Point> | null => {
        if (!predictionData?.predictions?.[0]?.fire_probability_map) {
            return null
        }

        const probMap = predictionData.predictions[0].fire_probability_map
        const mapCenter = predictionData.request?.location || { latitude: center[1], longitude: center[0] };
        const gridSizeDegrees = 0.5;

        const unTypedFeatures = probMap.flatMap((row: number[], i: number) =>
            row.map((probability: number, j: number) => {
                if (probability < 0.05) return null

                const lat = mapCenter.latitude - (gridSizeDegrees / 2) + (i / probMap.length) * gridSizeDegrees;
                const lon = mapCenter.longitude - (gridSizeDegrees / 2) + (j / row.length) * gridSizeDegrees;

                return {
                    type: 'Feature' as const,
                    geometry: { type: 'Point' as const, coordinates: [lon, lat] },
                    properties: {
                        mag: probability,
                        probability: (probability * 100).toFixed(2)
                    },
                }
            })
        ).filter((feature: null) => feature !== null); // FIX: Removed the incorrect type predicate here.

        // This ensures the final array matches the expected GeoJSON Feature type.
        const features: Feature<Point, GeoJsonProperties>[] = unTypedFeatures as Feature<Point, GeoJsonProperties>[];

        return { type: 'FeatureCollection', features }
    }, [predictionData, center])

    const probabilityExtrusions = useMemo(() => {
        if (!predictionData?.predictions?.[0]?.fire_probability_map) return null
        const mapCenter = predictionData.request?.location || { latitude: center[1], longitude: center[0] }
        return buildProbabilityExtrusions(predictionData.predictions[0].fire_probability_map, mapCenter)
    }, [predictionData, center])

    const activeFiresSource = useMemo((): FeatureCollection<Point> | null => {
        if (!realtimeData?.activeFires?.length) return null
        const features: Feature<Point, GeoJsonProperties>[] = realtimeData.activeFires.map(fire => ({
            type: 'Feature' as const,
            geometry: { type: 'Point', coordinates: [fire.longitude, fire.latitude] },
            properties: { ...fire }
        }))
        return { type: 'FeatureCollection', features }
    }, [realtimeData])

    const weatherStationsSource = useMemo((): FeatureCollection<Point> | null => {
        if (!realtimeData?.weatherStations?.length) return null
        const features: Feature<Point, GeoJsonProperties>[] = realtimeData.weatherStations.map(station => ({
            type: 'Feature' as const,
            geometry: { type: 'Point', coordinates: [station.longitude, station.latitude] },
            properties: { ...station }
        }))
        return { type: 'FeatureCollection', features }
    }, [realtimeData])

    const highRiskAreasSource = useMemo((): FeatureCollection<Polygon> | null => {
        if (!realtimeData?.highRiskAreas?.length) return null
        const features: Feature<Polygon, GeoJsonProperties>[] = realtimeData.highRiskAreas.map(area => {
            // Ensure polygon coordinates are wrapped per GeoJSON spec: [ [ [lng,lat], ... ] ]
            const coords = Array.isArray(area.polygon?.[0]?.[0]) ? area.polygon : [area.polygon]
            return {
                type: 'Feature' as const,
                geometry: { type: 'Polygon', coordinates: coords },
                properties: { ...area }
            }
        })
        return { type: 'FeatureCollection', features }
    }, [realtimeData])

    // Derived heatmap from active fires if no prediction grid
    const activeFiresHeatmapSource = useMemo((): FeatureCollection<Point> | null => {
        if (!realtimeData?.activeFires?.length) return null
        const maxBrightness = Math.max(...realtimeData.activeFires.map(f => f.brightness || 0), 1)
        const features: Feature<Point, GeoJsonProperties>[] = realtimeData.activeFires.map(fire => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [fire.longitude, fire.latitude] },
            properties: {
                intensity: Math.min(1, (fire.brightness || 0) / maxBrightness * (fire.confidence ? fire.confidence / 100 : 1)),
                id: fire.id
            }
        }))
        return { type: 'FeatureCollection', features }
    }, [realtimeData])


    // --- MAP INTERACTIONS AND EFFECTS ---

    // Auto-fit to available spatial data (prediction heatmap, else fires, else polygons)
    useEffect(() => {
        const map = mapRef.current?.getMap()
        if (!map) return

        let coords: [number, number][] = []
        if (heatmapSource?.features?.length) {
            coords = heatmapSource.features.map(f => (f.geometry as Point).coordinates as [number, number])
        } else if (activeFiresSource?.features?.length) {
            coords = activeFiresSource.features.map(f => (f.geometry as Point).coordinates as [number, number])
        } else if (highRiskAreasSource?.features?.length) {
            highRiskAreasSource.features.forEach(f => {
                const poly = f.geometry.coordinates?.[0] || []
                poly.forEach(p => coords.push(p as [number, number]))
            })
        }
        if (!coords.length) return
    // Use imported LngLatBounds (mapbox-gl v3 exports the class) instead of accessing via map instance
    const bounds = coords.reduce((b, c) => b.extend(c), new LngLatBounds(coords[0], coords[0]))
        mapRef.current?.fitBounds(bounds as LngLatBoundsLike, { padding: 60, duration: 1200 })
    }, [heatmapSource, activeFiresSource, highRiskAreasSource])

    const onMapClick = useCallback((event: any) => {
        if (!interactive) return
        const features = event.features as any[] | undefined
        if (!features?.length) return

        // Include probability extrusion (3D) layers & prioritise specificity
        const order = [
            PREDICTION_POINTS_LAYER.id,
            PROB_EXTRUSION_LAYER.id,
            ACTIVE_FIRES_LAYER.id,
            WEATHER_STATIONS_LAYER.id,
            HIGH_RISK_AREA_LAYER.id
        ]
        const picked = order
            .map(id => features.find(f => f.layer.id === id))
            .find(f => !!f)
        if (!picked) return

        // Determine popup type mapping
        let type: PopupInfo['type'] | null = null
        if (picked.layer.id === PREDICTION_POINTS_LAYER.id || picked.layer.id === PROB_EXTRUSION_LAYER.id) type = 'prediction'
        else if (picked.layer.id === ACTIVE_FIRES_LAYER.id) type = 'fire'
        else if (picked.layer.id === WEATHER_STATIONS_LAYER.id) type = 'weather'
        else if (picked.layer.id === HIGH_RISK_AREA_LAYER.id) type = 'risk_area'
        if (!type) return

        // Robust coordinate extraction (handles Point vs Polygon)
        let longitude = event.lngLat.lng
        let latitude = event.lngLat.lat
        try {
            const geom = picked.geometry
            if (geom?.type === 'Point' && Array.isArray(geom.coordinates)) {
                if (typeof geom.coordinates[0] === 'number' && typeof geom.coordinates[1] === 'number') {
                    longitude = geom.coordinates[0]
                    latitude = geom.coordinates[1]
                }
            } else if (geom?.type === 'Polygon' && Array.isArray(geom.coordinates)) {
                // Compute centroid of first linear ring
                const ring = geom.coordinates[0]
                if (Array.isArray(ring) && ring.length) {
                    let sumX = 0, sumY = 0, count = 0
                    ring.forEach((pt: any) => {
                        if (Array.isArray(pt) && typeof pt[0] === 'number' && typeof pt[1] === 'number') {
                            sumX += pt[0]; sumY += pt[1]; count++
                        }
                    })
                    if (count) {
                        longitude = sumX / count
                        latitude = sumY / count
                    }
                }
            }
        } catch (_) {
            // Fallback already set to event lng/lat
        }

        // Enrich prediction (extrusion) data with a probability percentage if value property exists
        const dataProps = { ...picked.properties }
        if (type === 'prediction') {
            if (dataProps.value && !dataProps.probability) {
                dataProps.probability = (dataProps.value * 100).toFixed(2)
            }
            if (dataProps.mag && !dataProps.probability) {
                dataProps.probability = (dataProps.mag * 100).toFixed(2)
            }
        }

        setPopupInfo({ longitude, latitude, data: dataProps, type })
    }, [interactive])

    const handleLayerToggle = (layerName: keyof typeof visibleLayers) => {
        setVisibleLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }))
    }

    const renderPopup = () => {
        if (!popupInfo) return null

        let content = null
        switch (popupInfo.type) {
            case 'prediction':
                content = (
                    <div className="space-y-1">
                        <h4 className="font-bold text-base flex items-center gap-2">
                            <Flame className="h-4 w-4 text-cyan-400" /> Prediction Cell
                        </h4>
                        <p><strong>Probability:</strong> {popupInfo.data.probability || (popupInfo.data.mag ? (popupInfo.data.mag * 100).toFixed(2) : '—')}%</p>
                        {popupInfo.longitude && popupInfo.latitude && (
                            <p className="text-xs text-gray-400">Lon {popupInfo.longitude.toFixed(4)}, Lat {popupInfo.latitude.toFixed(4)}</p>
                        )}
                    </div>
                )
                break
            case 'fire':
                content = (
                    <div className="space-y-1">
                        <h4 className="font-bold text-base flex items-center gap-2">
                            <Flame className="h-4 w-4 text-red-500" /> Active Fire
                        </h4>
                        <p><strong>ID:</strong> {popupInfo.data.id}</p>
                        <p><strong>Brightness:</strong> {popupInfo.data.brightness} K</p>
                        <p><strong>Confidence:</strong> {popupInfo.data.confidence}%</p>
                        <p><strong>Source:</strong> {popupInfo.data.source}</p>
                    </div>
                )
                break
            case 'weather':
                content = (
                    <div className="space-y-1">
                        <h4 className="font-bold text-base flex items-center gap-2">
                            <Cloud className="h-4 w-4 text-blue-500" /> Weather Station
                        </h4>
                        <p><strong>ID:</strong> {popupInfo.data.id}</p>
                        <p>
                            <Thermometer className="inline h-4 w-4 mr-1" />
                            <strong>Temp:</strong> {popupInfo.data.temperature}°C
                        </p>
                        <p>
                            <Wind className="inline h-4 w-4 mr-1" />
                            <strong>Wind:</strong> {popupInfo.data.wind_speed} mph {popupInfo.data.wind_direction}
                        </p>
                    </div>
                )
                break
            case 'risk_area':
                content = (
                    <div className="space-y-1">
                        <h4 className="font-bold text-base flex items-center gap-2">
                            <Eye className="h-4 w-4 text-orange-500" /> High Risk Area
                        </h4>
                        <p><strong>Name:</strong> {popupInfo.data.name}</p>
                        <p><strong>Risk Level:</strong> {popupInfo.data.risk_level}</p>
                        <p><strong>Primary Cause:</strong> {popupInfo.data.cause}</p>
                    </div>
                )
                break
        }

        return (
            <Popup
                longitude={popupInfo.longitude}
                latitude={popupInfo.latitude}
                onClose={() => setPopupInfo(null)}
                closeOnClick={false}
                anchor="bottom"
                className="fire-popup font-sans"
            >
                {content}
            </Popup>
        )
    }

    return (
        <div className="w-full h-full relative" style={style}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: center[0],
                    latitude: center[1],
                    zoom: zoom
                }}
                mapboxAccessToken={MAPBOX_TOKEN}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                style={{ width: '100%', height: '100%' }}
                interactive={interactive}
                onClick={onMapClick}
                onLoad={() => setIsStyleLoaded(true)}
                interactiveLayerIds={
                    interactive ? [PREDICTION_POINTS_LAYER.id, PROB_EXTRUSION_LAYER.id, ACTIVE_FIRES_LAYER.id, WEATHER_STATIONS_LAYER.id, HIGH_RISK_AREA_LAYER.id] : []
                }
            >
                <NavigationControl position="top-right" />
                <FullscreenControl position="top-right" />
                <ScaleControl />

                {isStyleLoaded && (
                    <>
                                {heatmapSource && visibleLayers.heatmap && (
                                    <Source id="prediction-source" type="geojson" data={heatmapSource}>
                                        <Layer {...HEATMAP_LAYER} />
                                        <Layer {...PREDICTION_POINTS_LAYER} />
                                    </Source>
                                )}
                        {highRiskAreasSource && visibleLayers.highRiskAreas && (
                            <Source id="high-risk-areas-source" type="geojson" data={highRiskAreasSource}>
                                <Layer {...HIGH_RISK_AREA_LAYER} />
                            </Source>
                        )}
                        {probabilityExtrusions && visibleLayers.probability3D && (
                            <Source id="probability-extrusions-source" type="geojson" data={probabilityExtrusions}>
                                <Layer {...PROB_EXTRUSION_LAYER} />
                                {visibleLayers.contours && <Layer {...CONTOUR_LAYER} />}
                            </Source>
                        )}
                        {activeFiresHeatmapSource && visibleLayers.activeFireIntensity && !heatmapSource && (
                            <Source id="active-fires-heatmap-source" type="geojson" data={activeFiresHeatmapSource}>
                                <Layer {...ACTIVE_FIRE_INTENSITY_HEATMAP} />
                            </Source>
                        )}
                        {activeFiresSource && visibleLayers.activeFires && (
                            <Source id="active-fires-source" type="geojson" data={activeFiresSource}>
                                <Layer {...ACTIVE_FIRES_LAYER} />
                            </Source>
                        )}
                        {weatherStationsSource && visibleLayers.weatherStations && (
                            <Source id="weather-stations-source" type="geojson" data={weatherStationsSource}>
                                <Layer {...WEATHER_STATIONS_LAYER} />
                            </Source>
                        )}
                    </>
                )}

                {renderPopup()}
            </Map>

                        {/* Dark popup styling to ensure contrast */}
                        <style jsx global>{`
                            .mapboxgl-popup.fire-popup .mapboxgl-popup-content { 
                                background:#111827; /* gray-900 */
                                color:#f1f5f9; /* slate-100 */
                                border:1px solid #374151; /* gray-700 */
                                box-shadow:0 4px 14px rgba(0,0,0,0.5);
                                font-size:13px;
                            }
                            .mapboxgl-popup.fire-popup .mapboxgl-popup-tip { display:none; }
                            .mapboxgl-popup.fire-popup h4 { color:#fde68a; /* amber-200 */ }
                            .mapboxgl-popup-close-button { color:#f1f5f9; font-size:16px; }
                            .mapboxgl-popup-close-button:hover { color:#fff; }
                        `}</style>

            <AnimatePresence>
                {isControlsOpen ? (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-4 right-20 bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg p-3 text-white text-sm space-y-2 shadow-lg"
                    >
                        <div className="flex justify-between items-center mb-1">
                            <h5 className="font-bold">Data Layers</h5>
                            <button onClick={() => setControlsOpen(false)} className="text-gray-400 hover:text-white">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {Object.entries({
                            heatmap: { name: 'Prediction Heatmap', icon: <Flame className="text-red-500" /> },
                            probability3D: { name: '3D Probability', icon: <Layers className="text-purple-400" /> },
                            contours: { name: 'Contours', icon: <Layers className="text-gray-300" /> },
                            activeFireIntensity: { name: 'Fire Intensity Heatmap', icon: <Flame className="text-red-400" /> },
                            activeFires: { name: 'Active Fires', icon: <Flame className="text-orange-400" /> },
                            highRiskAreas: { name: 'High Risk Zones', icon: <Eye className="text-yellow-400" /> },
                            weatherStations: { name: 'Weather Stations', icon: <Cloud className="text-blue-400" /> },
                        }).map(([key, {name, icon}]) => (
                            <label key={key} className="flex items-center gap-2 cursor-pointer hover:bg-gray-800 p-1 rounded-md">
                                <input
                                    type="checkbox"
                                    className="form-checkbox bg-gray-700 border-gray-600 rounded text-red-500 focus:ring-red-500"
                                    checked={visibleLayers[key as keyof typeof visibleLayers]}
                                    onChange={() => handleLayerToggle(key as keyof typeof visibleLayers)}
                                />
                                <span className="flex-shrink-0">{icon}</span>
                                <span className="flex-grow">{name}</span>
                            </label>
                        ))}
                        <div className="mt-3 pt-2 border-t border-gray-700 space-y-1">
                            <h6 className="text-xs font-semibold text-gray-400">Legend</h6>
                            <div className="space-y-1">
                                <div className="flex items-center gap-2"><span className="h-2 w-16 bg-gradient-to-r from-blue-900 via-cyan-400 via-green-400 via-yellow-300 via-orange-500 to-red-600 rounded" /> <span className="text-2xs text-gray-400">Low → High</span></div>
                                {visibleLayers.probability3D && <div className="text-2xs text-purple-300">3D extrusions scale with probability</div>}
                                {heatmapSource && <div className="text-2xs text-gray-500">Prediction grid active</div>}
                                {!heatmapSource && activeFiresHeatmapSource && <div className="text-2xs text-gray-500">Live fire intensity heatmap</div>}
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        className="absolute top-4 right-20"
                    >
                        <button
                            onClick={() => setControlsOpen(true)}
                            className="bg-gray-900/80 backdrop-blur-md border border-gray-700 rounded-lg p-2 text-white shadow-lg hover:bg-gray-800"
                        >
                            <Layers className="h-5 w-5" />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!MAPBOX_TOKEN && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-red-400 text-sm z-50">
                    Missing Mapbox token. Set NEXT_PUBLIC_MAPBOX_TOKEN in your environment.
                </div>
            )}

            {(!heatmapSource && !activeFiresSource && !highRiskAreasSource) && (
                <div className="absolute bottom-4 left-4 bg-gray-900/80 text-gray-300 px-3 py-2 rounded text-xs z-30">
                    No spatial data yet. Run a prediction or load realtime feeds.
                </div>
            )}
        </div>
    )
}