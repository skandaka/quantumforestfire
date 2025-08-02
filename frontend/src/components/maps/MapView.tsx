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
import { LngLatBoundsLike } from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// --- TYPE DEFINITIONS ---
interface PopupInfo {
    longitude: number
    latitude: number
    data: Record<string, any>
    type: 'fire' | 'weather' | 'risk_area'
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
        'heatmap-color': [
            'interpolate',
            ['linear'],
            ['heatmap-density'],
            0, 'rgba(0, 0, 255, 0)',
            0.1, 'rgba(0, 255, 255, 0.3)',
            0.3, 'rgba(0, 255, 0, 0.4)',
            0.5, 'rgba(255, 255, 0, 0.5)',
            0.7, 'rgba(255, 165, 0, 0.6)',
            0.9, 'rgba(255, 0, 0, 0.7)',
            1, 'rgba(128, 0, 0, 0.8)'
        ],
        'heatmap-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            8, 15,
            15, 50
        ],
        'heatmap-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            13, 0.8,
            15, 0.2
        ]
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
        'fill-color': '#FF8C00',
        'fill-opacity': [
            'interpolate',
            ['linear'],
            ['get', 'risk_level'],
            0, 0.1,
            1, 0.4
        ],
        'fill-outline-color': '#FF4500'
    }
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
        activeFires: true,
        weatherStations: true,
        highRiskAreas: true,
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
        const features: Feature<Polygon, GeoJsonProperties>[] = realtimeData.highRiskAreas.map(area => ({
            type: 'Feature' as const,
            geometry: { type: 'Polygon', coordinates: area.polygon },
            properties: { ...area }
        }))
        return { type: 'FeatureCollection', features }
    }, [realtimeData])


    // --- MAP INTERACTIONS AND EFFECTS ---

    useEffect(() => {
        if (!heatmapSource?.features?.length || !mapRef.current) return

        const coordinates = heatmapSource.features.map(f => (f.geometry as Point).coordinates as [number, number]);
        const bounds = coordinates.reduce((bounds, coord) => {
            return bounds.extend(coord);
        }, new (mapRef.current.getMap() as any).LngLatBounds(coordinates[0], coordinates[0]));

        mapRef.current.fitBounds(bounds as LngLatBoundsLike, {
            padding: 80,
            duration: 2000
        });
    }, [heatmapSource])

    const onMapClick = useCallback((event: any) => {
        if (!interactive) return
        const features = event.features

        if (features && features.length > 0) {
            const feature = features[0]
            let type: PopupInfo['type'] | null = null

            if (feature.layer.id === ACTIVE_FIRES_LAYER.id) type = 'fire'
            if (feature.layer.id === WEATHER_STATIONS_LAYER.id) type = 'weather'
            if (feature.layer.id === HIGH_RISK_AREA_LAYER.id) type = 'risk_area'

            if (type) {
                setPopupInfo({
                    longitude: event.lngLat.lng,
                    latitude: event.lngLat.lat,
                    data: feature.properties,
                    type
                })
            }
        }
    }, [interactive])

    const handleLayerToggle = (layerName: keyof typeof visibleLayers) => {
        setVisibleLayers(prev => ({ ...prev, [layerName]: !prev[layerName] }))
    }

    const renderPopup = () => {
        if (!popupInfo) return null

        let content = null
        switch (popupInfo.type) {
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
                className="font-sans"
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
                    interactive ? [ACTIVE_FIRES_LAYER.id, WEATHER_STATIONS_LAYER.id, HIGH_RISK_AREA_LAYER.id] : []
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
                            </Source>
                        )}
                        {highRiskAreasSource && visibleLayers.highRiskAreas && (
                            <Source id="high-risk-areas-source" type="geojson" data={highRiskAreasSource}>
                                <Layer {...HIGH_RISK_AREA_LAYER} />
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
        </div>
    )
}