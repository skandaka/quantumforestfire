'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1Ijoic2thdGUiLCJhIjoiY21kOTlxOW1iMDV1bzJtcHY3bmFobnVmcCJ9.zDBww977UxLmhPDSeZk5Jw';

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

interface FireMapProps {
    fires: FireData[];
    weather?: any;
    terrain?: any;
    center?: [number, number];
    zoom?: number;
    showHeatmap?: boolean;
    showParadiseDemo?: boolean;
    className?: string;
}

const FireMap: React.FC<FireMapProps> = ({
                                             fires = [],
                                             weather,
                                             terrain,
                                             center = [-121.6219, 39.7596], // Paradise, CA
                                             zoom = 8,
                                             showHeatmap = true,
                                             showParadiseDemo = false,
                                             className = ''
                                         }) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [selectedFire, setSelectedFire] = useState<FireData | null>(null);
    const markersRef = useRef<mapboxgl.Marker[]>([]);

    // Initialize map
    useEffect(() => {
        if (!mapContainer.current || map.current) return;

        try {
            map.current = new mapboxgl.Map({
                container: mapContainer.current,
                style: 'mapbox://styles/mapbox/satellite-streets-v12',
                center: center,
                zoom: zoom,
                pitch: 45,
                bearing: 0
            });

            map.current.on('load', () => {
                setIsLoaded(true);
                initializeMapLayers();
            });

            // Add navigation controls
            map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

            // Add fullscreen control
            map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');

        } catch (error) {
            console.error('Error initializing map:', error);
        }

        return () => {
            if (map.current) {
                map.current.remove();
                map.current = null;
            }
        };
    }, [center, zoom]);

    // Initialize map layers for fire visualization
    const initializeMapLayers = useCallback(() => {
        if (!map.current || !isLoaded) return;

        try {
            // Add fire heatmap source
            if (!map.current.getSource('fires-heatmap')) {
                map.current.addSource('fires-heatmap', {
                    type: 'geojson',
                    data: {
                        type: 'FeatureCollection',
                        features: []
                    }
                });

                // Add heatmap layer
                map.current.addLayer({
                    id: 'fires-heatmap-layer',
                    type: 'heatmap',
                    source: 'fires-heatmap',
                    maxzoom: 15,
                    paint: {
                        'heatmap-weight': [
                            'interpolate',
                            ['linear'],
                            ['get', 'intensity'],
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
                            0, 'rgba(255,255,255,0)',
                            0.2, 'rgb(255,255,0)',
                            0.4, 'rgb(255,165,0)',
                            0.6, 'rgb(255,69,0)',
                            0.8, 'rgb(255,0,0)',
                            1, 'rgb(128,0,0)'
                        ],
                        'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            0, 20,
                            15, 50
                        ],
                        'heatmap-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            7, 1,
                            15, 0.8
                        ]
                    }
                });

                // Add fire points layer
                map.current.addLayer({
                    id: 'fires-points',
                    type: 'circle',
                    source: 'fires-heatmap',
                    minzoom: 10,
                    paint: {
                        'circle-radius': [
                            'interpolate',
                            ['linear'],
                            ['get', 'intensity'],
                            0, 5,
                            1, 20
                        ],
                        'circle-color': [
                            'interpolate',
                            ['linear'],
                            ['get', 'intensity'],
                            0, '#ffff00',
                            0.5, '#ff8c00',
                            1, '#ff0000'
                        ],
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 2,
                        'circle-opacity': 0.8
                    }
                });

                // Add fire labels
                map.current.addLayer({
                    id: 'fires-labels',
                    type: 'symbol',
                    source: 'fires-heatmap',
                    minzoom: 12,
                    layout: {
                        'text-field': ['concat', ['get', 'area_hectares'], ' ha'],
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 10,
                        'text-offset': [0, 1.5],
                        'text-anchor': 'top'
                    },
                    paint: {
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 1
                    }
                });

                // Add click handler for fire points
                map.current.on('click', 'fires-points', (e) => {
                    if (e.features && e.features[0]) {
                        const feature = e.features[0];
                        const properties = feature.properties;

                        if (properties) {
                            setSelectedFire({
                                id: properties.id,
                                latitude: properties.latitude,
                                longitude: properties.longitude,
                                intensity: properties.intensity,
                                area_hectares: properties.area_hectares,
                                confidence: properties.confidence,
                                brightness_temperature: properties.brightness_temperature,
                                detection_time: properties.detection_time,
                                satellite: properties.satellite,
                                frp: properties.frp
                            });

                            // Create popup
                            const popup = new mapboxgl.Popup()
                                .setLngLat([properties.longitude, properties.latitude])
                                .setHTML(`
                  <div class="fire-popup">
                    <h3>Active Fire</h3>
                    <p><strong>Intensity:</strong> ${(properties.intensity * 100).toFixed(1)}%</p>
                    <p><strong>Area:</strong> ${properties.area_hectares} hectares</p>
                    <p><strong>Confidence:</strong> ${properties.confidence}%</p>
                    <p><strong>Temperature:</strong> ${properties.brightness_temperature}°C</p>
                    <p><strong>Satellite:</strong> ${properties.satellite}</p>
                    <p><strong>Detection:</strong> ${new Date(properties.detection_time).toLocaleString()}</p>
                  </div>
                `)
                                .addTo(map.current!);
                        }
                    }
                });

                // Change cursor on hover
                map.current.on('mouseenter', 'fires-points', () => {
                    if (map.current) {
                        map.current.getCanvas().style.cursor = 'pointer';
                    }
                });

                map.current.on('mouseleave', 'fires-points', () => {
                    if (map.current) {
                        map.current.getCanvas().style.cursor = '';
                    }
                });
            }

            if (showParadiseDemo) {
                addParadiseDemoLayers();
            }

        } catch (error) {
            console.error('Error initializing map layers:', error);
        }
    }, [isLoaded, showParadiseDemo]);

    // Add Paradise demo specific layers
    const addParadiseDemoLayers = useCallback(() => {
        if (!map.current || !isLoaded) return;

        try {
            // Paradise town boundary
            if (!map.current.getSource('paradise-boundary')) {
                map.current.addSource('paradise-boundary', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Polygon',
                            coordinates: [[
                                [-121.65, 39.73],
                                [-121.58, 39.73],
                                [-121.58, 39.78],
                                [-121.65, 39.78],
                                [-121.65, 39.73]
                            ]]
                        },
                        properties: {
                            name: 'Paradise, CA'
                        }
                    }
                });

                map.current.addLayer({
                    id: 'paradise-boundary-fill',
                    type: 'fill',
                    source: 'paradise-boundary',
                    paint: {
                        'fill-color': '#ff9900',
                        'fill-opacity': 0.3
                    }
                });

                map.current.addLayer({
                    id: 'paradise-boundary-line',
                    type: 'line',
                    source: 'paradise-boundary',
                    paint: {
                        'line-color': '#ff6600',
                        'line-width': 3
                    }
                });

                map.current.addLayer({
                    id: 'paradise-label',
                    type: 'symbol',
                    source: 'paradise-boundary',
                    layout: {
                        'text-field': 'Paradise, CA',
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 16,
                        'text-anchor': 'center'
                    },
                    paint: {
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 2
                    }
                });
            }

            // Historical fire origin point
            if (!map.current.getSource('fire-origin')) {
                map.current.addSource('fire-origin', {
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [-121.605, 39.794] // Near Pulga
                        },
                        properties: {
                            name: 'Camp Fire Origin',
                            description: 'November 8, 2018 - 6:30 AM'
                        }
                    }
                });

                map.current.addLayer({
                    id: 'fire-origin-point',
                    type: 'circle',
                    source: 'fire-origin',
                    paint: {
                        'circle-radius': 12,
                        'circle-color': '#ff0000',
                        'circle-stroke-color': '#ffffff',
                        'circle-stroke-width': 3
                    }
                });

                map.current.addLayer({
                    id: 'fire-origin-label',
                    type: 'symbol',
                    source: 'fire-origin',
                    layout: {
                        'text-field': 'Fire Origin\n6:30 AM',
                        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                        'text-size': 12,
                        'text-offset': [0, 2],
                        'text-anchor': 'top'
                    },
                    paint: {
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 2
                    }
                });
            }

        } catch (error) {
            console.error('Error adding Paradise demo layers:', error);
        }
    }, [isLoaded]);

    // Update fire data
    useEffect(() => {
        if (!map.current || !isLoaded || !fires.length) return;

        try {
            const geojsonData = {
                type: 'FeatureCollection' as const,
                features: fires.map(fire => ({
                    type: 'Feature' as const,
                    geometry: {
                        type: 'Point' as const,
                        coordinates: [fire.longitude, fire.latitude]
                    },
                    properties: {
                        id: fire.id,
                        latitude: fire.latitude,
                        longitude: fire.longitude,
                        intensity: fire.intensity,
                        area_hectares: fire.area_hectares,
                        confidence: fire.confidence,
                        brightness_temperature: fire.brightness_temperature,
                        detection_time: fire.detection_time,
                        satellite: fire.satellite,
                        frp: fire.frp
                    }
                }))
            };

            const source = map.current.getSource('fires-heatmap') as mapboxgl.GeoJSONSource;
            if (source) {
                source.setData(geojsonData);
            }

            // Update layer visibility based on props
            if (map.current.getLayer('fires-heatmap-layer')) {
                map.current.setLayoutProperty(
                    'fires-heatmap-layer',
                    'visibility',
                    showHeatmap ? 'visible' : 'none'
                );
            }

        } catch (error) {
            console.error('Error updating fire data:', error);
        }
    }, [fires, isLoaded, showHeatmap]);

    // Paradise demo effect
    useEffect(() => {
        if (showParadiseDemo && isLoaded) {
            // Center on Paradise
            map.current?.easeTo({
                center: [-121.6219, 39.7596],
                zoom: 11,
                duration: 2000
            });
        }
    }, [showParadiseDemo, isLoaded]);

    return (
        <div className={`relative w-full h-full ${className}`}>
            <div ref={mapContainer} className="w-full h-full" />

            {/* Fire statistics overlay */}
            {fires.length > 0 && (
                <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
                    <h3 className="text-lg font-bold mb-2">Fire Statistics</h3>
                    <div className="space-y-1 text-sm">
                        <div>Active Fires: <span className="font-semibold text-red-400">{fires.length}</span></div>
                        <div>Total Area: <span className="font-semibold text-orange-400">
              {fires.reduce((sum, fire) => sum + fire.area_hectares, 0).toLocaleString()} ha
            </span></div>
                        <div>Avg Intensity: <span className="font-semibold text-yellow-400">
              {((fires.reduce((sum, fire) => sum + fire.intensity, 0) / fires.length) * 100).toFixed(1)}%
            </span></div>
                        <div>High Confidence: <span className="font-semibold text-green-400">
              {fires.filter(fire => fire.confidence >= 80).length}
            </span></div>
                    </div>
                </div>
            )}

            {/* Weather info overlay */}
            {weather && (
                <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
                    <h3 className="text-lg font-bold mb-2">Weather Conditions</h3>
                    <div className="space-y-1 text-sm">
                        <div>Temperature: <span className="font-semibold">{weather.current_conditions?.avg_temperature}°C</span></div>
                        <div>Humidity: <span className="font-semibold">{weather.current_conditions?.avg_humidity}%</span></div>
                        <div>Wind Speed: <span className="font-semibold">{weather.current_conditions?.avg_wind_speed} km/h</span></div>
                        {weather.fire_weather?.red_flag_warning && (
                            <div className="text-red-400 font-bold">🚨 Red Flag Warning</div>
                        )}
                    </div>
                </div>
            )}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg">
                <h4 className="font-bold mb-2">Fire Intensity</h4>
                <div className="flex items-center space-x-2 text-xs">
                    <div className="w-4 h-4 rounded-full bg-yellow-400"></div>
                    <span>Low</span>
                    <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                    <span>Medium</span>
                    <div className="w-4 h-4 rounded-full bg-red-600"></div>
                    <span>High</span>
                </div>
            </div>

            {/* Paradise demo info */}
            {showParadiseDemo && (
                <div className="absolute bottom-4 right-4 bg-red-900 bg-opacity-90 text-white p-4 rounded-lg max-w-sm">
                    <h3 className="text-lg font-bold mb-2">🔥 Paradise Fire Demo</h3>
                    <div className="text-sm space-y-1">
                        <div><strong>Date:</strong> November 8, 2018</div>
                        <div><strong>Origin:</strong> Near Pulga, CA</div>
                        <div><strong>Quantum Advantage:</strong> 27 min early warning</div>
                        <div><strong>Lives Saved:</strong> Could have saved 85 lives</div>
                        <div className="mt-2 p-2 bg-yellow-600 rounded">
                            <strong>Quantum Detection:</strong> Ember jump detected at 7:35 AM,
                            Paradise ignition at 8:00 AM
                        </div>
                    </div>
                </div>
            )}

            {/* Loading indicator */}
            {!isLoaded && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="text-white text-lg">Loading fire visualization...</div>
                </div>
            )}
        </div>
    );
};

export default FireMap;
