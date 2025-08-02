import { NextResponse } from 'next/server'
import type { DemoStageData } from '@/hooks/useParadiseFireDemo'
import { LngLatLike } from 'mapbox-gl'

/**
 * API route handler for the staged Paradise Fire demo.
 * It uses a dynamic route segment `[stage]` to return data for a specific timeline event.
 */
export async function GET(
    request: Request,
    { params }: { params: { stage: string } }
) {
    try {
        const stage = parseInt(params.stage, 10)

        if (isNaN(stage) || stage < 0 || stage > 3) {
            return NextResponse.json({ error: 'Invalid stage index.' }, { status: 400 })
        }

        // --- MOCK DATA GENERATION ---
        const PARADISE_CENTER = { lat: 39.7591, lon: -121.6175 }
        const FIRE_ORIGIN = { lat: 39.794, lon: -121.605 }

        const generateDemoDataForStage = (stage: number): DemoStageData => {
            let fires: any[] = []
            let emberArea: LngLatLike[] | undefined = undefined

            if (stage >= 0) {
                fires.push({ id: 'origin_fire', latitude: FIRE_ORIGIN.lat, longitude: FIRE_ORIGIN.lon, brightness: 350, confidence: 95, })
            }
            if (stage >= 1) {
                fires = Array.from({ length: 10 }, (_, i) => ({ id: `spread_${i}`, latitude: FIRE_ORIGIN.lat - i * 0.005, longitude: FIRE_ORIGIN.lon + i * 0.002, brightness: 380 + i * 5, confidence: 90, }))
            }
            if (stage >= 2) {
                fires = Array.from({ length: 50 }, (_, i) => ({ id: `large_spread_${i}`, latitude: FIRE_ORIGIN.lat - Math.random() * 0.1, longitude: FIRE_ORIGIN.lon + Math.random() * 0.05, brightness: 450 + Math.random() * 50, confidence: 98, }))
                const emberCenter = { lat: PARADISE_CENTER.lat, lon: PARADISE_CENTER.lon }
                const size = 0.08
                emberArea = [ [emberCenter.lon - size, emberCenter.lat - size], [emberCenter.lon + size, emberCenter.lat - size], [emberCenter.lon + size, emberCenter.lat + size], [emberCenter.lon - size, emberCenter.lat + size], [emberCenter.lon - size, emberCenter.lat - size], ]
            }
            if (stage >= 3) {
                const paradiseFires = Array.from({ length: 100 }, (_, i) => ({ id: `paradise_spot_${i}`, latitude: PARADISE_CENTER.lat + (Math.random() - 0.5) * 0.1, longitude: PARADISE_CENTER.lon + (Math.random() - 0.5) * 0.1, brightness: 400 + Math.random() * 80, confidence: 85, }))
                fires.push(...paradiseFires)
            }

            return { stage, timestamp: new Date().toISOString(), fire_locations: fires, ember_prediction_area: emberArea, weather_stations: [ { id: 'jarbo_gap', latitude: 39.7, longitude: -121.5, wind_speed: 40 + stage * 5 }, ], }
        }

        const data = generateDemoDataForStage(stage);

        await new Promise(resolve => setTimeout(resolve, 500));

        return NextResponse.json(data)

    } catch (error) {
        console.error(`[API DEMO STAGE ERROR]`, error);
        return NextResponse.json({ error: 'Failed to fetch demo stage data.' }, { status: 500 })
    }
}