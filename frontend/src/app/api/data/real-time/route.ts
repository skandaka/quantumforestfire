import { NextResponse } from 'next/server'
import type { RealTimeData, ActiveFire, WeatherStation, HighRiskArea, Alert } from '@/hooks/useRealTimeData'
import { LngLatLike } from 'mapbox-gl'

/**
 * API route handler for fetching live situational data.
 * This simulates a backend service that fuses data from multiple sources like NASA and NOAA.
 */
export async function GET() {
    try {
        // --- MOCK DATA GENERATION ---
        const getRandomCoordinate = (baseLat: number, baseLon: number, range: number) => ({
            latitude: baseLat + (Math.random() - 0.5) * range,
            longitude: baseLon + (Math.random() - 0.5) * range,
        })

        const generateMockFires = (count: number): ActiveFire[] => {
            return Array.from({ length: count }, (_, i) => ({
                id: `fire_${i}_${Date.now()}`,
                ...getRandomCoordinate(39.7, -121.5, 2.5),
                brightness: Math.floor(Math.random() * 100 + 300),
                confidence: Math.floor(Math.random() * 50 + 50),
                source: 'NASA FIRMS',
                timestamp: new Date().toISOString(),
            }))
        }

        const generateMockWeatherStations = (count: number): WeatherStation[] => {
            return Array.from({ length: count }, (_, i) => ({
                id: `station_${i}`,
                name: `Station #${i}`,
                ...getRandomCoordinate(39.7, -121.5, 3),
                temperature: Math.floor(Math.random() * 15 + 20),
                humidity: Math.floor(Math.random() * 40 + 15),
                wind_speed: Math.floor(Math.random() * 25 + 5),
                wind_direction: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
            }));
        };

        const generateMockRiskAreas = (count: number): HighRiskArea[] => {
            return Array.from({ length: count }, (_, i) => {
                const center = getRandomCoordinate(39.7, -121.5, 2);
                const size = Math.random() * 0.1 + 0.05;
                const polygon: LngLatLike[] = [
                    [center.longitude - size, center.latitude - size],
                    [center.longitude + size, center.latitude - size],
                    [center.longitude + size, center.latitude + size],
                    [center.longitude - size, center.latitude + size],
                    [center.longitude - size, center.latitude - size],
                ];
                return {
                    id: `risk_area_${i}`,
                    name: `Zone ${String.fromCharCode(65 + i)}`,
                    risk_level: Math.random() * 0.6 + 0.4,
                    cause: ['Drought', 'Wind Pattern', 'High Fuel Load'][Math.floor(Math.random() * 3)] as any,
                    polygon,
                };
            });
        };

        const generateMockAlerts = (fires: ActiveFire[], areas: HighRiskArea[]): Alert[] => {
            const alerts: Alert[] = [];
            if (fires.length > 5) {
                alerts.push({
                    id: `alert_fire_count`,
                    title: 'Multiple New Fire Ignitions Detected',
                    message: `${fires.length} new potential fires detected in the last 30 minutes. System is actively monitoring spread.`,
                    severity: 'high',
                    timestamp: new Date().toISOString()
                })
            }
            const criticalArea = areas.find(a => a.risk_level > 0.9);
            if (criticalArea) {
                alerts.push({
                    id: `alert_risk_${criticalArea.id}`,
                    title: `Critical Risk in ${criticalArea.name}`,
                    message: `Fuel and weather conditions have reached critical levels. Immediate spread is highly likely if ignition occurs.`,
                    severity: 'critical',
                    timestamp: new Date().toISOString(),
                    location: { 
                        name: criticalArea.name, 
                        latitude: Array.isArray(criticalArea.polygon[0]) ? criticalArea.polygon[0][1] : 0, 
                        longitude: Array.isArray(criticalArea.polygon[0]) ? criticalArea.polygon[0][0] : 0
                    }
                })
            }
            return alerts;
        }

        const mockFires = generateMockFires(Math.floor(Math.random() * 8) + 1); // Ensure at least one fire
        const mockStations = generateMockWeatherStations(10);
        const mockAreas = generateMockRiskAreas(3);
        const mockAlerts = generateMockAlerts(mockFires, mockAreas);

        const mockData: RealTimeData = {
            active_fires: mockFires,
            weather_stations: mockStations,
            high_risk_areas: mockAreas,
            alerts: mockAlerts,
            current_conditions: {
                avg_wind_speed: Math.floor(Math.random() * 15 + 10),
                max_temp: Math.floor(Math.random() * 10 + 25),
            }
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        return NextResponse.json(mockData)

    } catch (error) {
        console.error('[API REAL-TIME ERROR]', error);
        return NextResponse.json({ error: 'Failed to fetch real-time data.' }, { status: 500 })
    }
}