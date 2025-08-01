import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const mockData = {
      status: 'connected',
      quantum_volume: 4096,
      active_circuits: 47,
      error_rate: 0.0016,
      coherence_time: 127.3,
      entanglement_fidelity: 0.997,
      hardware_status: {
        backend: 'ibm_osaka',
        qubits: 127,
        status: 'online'
      }
    }

    return NextResponse.json(mockData)
  } catch (error) {
    console.error('Classiq API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quantum data' },
      { status: 500 }
    )
  }
}
