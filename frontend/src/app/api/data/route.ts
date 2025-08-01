import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Mock fire data response
    const mockData = {
      active_fires: [
        {
          center_lat: 39.7596,
          center_lon: -121.6219,
          intensity: 0.8,
          area_hectares: 150,
          confidence: 0.92,
          detection_time: new Date().toISOString()
        }
      ],
      weather_data: {
        temperature: 25,
        humidity: 30,
        wind_speed: 15,
        wind_direction: 225
      }
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Data API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
