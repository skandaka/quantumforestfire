import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Mock prediction response
    const mockPrediction = {
      prediction_id: `pred_${Date.now()}`,
      fire_probability: Math.random() * 0.4 + 0.6,
      spread_direction: 225,
      estimated_area: Math.floor(Math.random() * 1000) + 500,
      confidence: Math.random() * 0.2 + 0.8,
      quantum_advantage: true,
      processing_time: Math.random() * 2 + 0.5
    }

    return NextResponse.json(mockPrediction)
  } catch (error) {
    console.error('Predictions API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate prediction' },
      { status: 500 }
    )
  }
}
