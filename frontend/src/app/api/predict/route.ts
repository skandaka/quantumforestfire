import { NextResponse } from 'next/server'
import type { PredictionRequest, PredictionResult, QuantumMetrics } from '@/hooks/useQuantumPrediction'

/**
 * API route handler for running a new quantum prediction.
 * In a real application, this would trigger a long-running job on the backend.
 * Here, we simulate that process and return mock data.
 */
export async function POST(request: Request) {
    try {
        const requestData: PredictionRequest = await request.json()

        // --- MOCK DATA GENERATION ---
        // This logic is moved from the hook to the API layer, which is a more realistic architecture.

        // Simulate a failure for a specific model for testing purposes
        if (requestData.model === 'qiskit_fire_spread') {
            return NextResponse.json(
                { error: 'Qiskit simulator is currently offline for maintenance.' },
                { status: 400 }
            )
        }

        const requestId = `prod_req_${Math.random().toString(36).substring(7)}`

        const generateFireMap = (rows: number, cols: number): number[][] => {
            const map = Array.from({ length: rows }, () => Array(cols).fill(0));
            const fireCenters = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
                r: Math.floor(Math.random() * rows),
                c: Math.floor(Math.random() * cols),
                intensity: Math.random() * 0.7 + 0.3
            }));

            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < cols; c++) {
                    let prob = 0;
                    for (const center of fireCenters) {
                        const dist = Math.sqrt(Math.pow(r - center.r, 2) + Math.pow(c - center.c, 2));
                        const influence = center.intensity * Math.exp(-Math.pow(dist, 2) / (2 * Math.pow(rows / 8, 2)));
                        prob += influence;
                    }
                    map[r][c] = Math.min(1.0, prob + (Math.random() - 0.5) * 0.1);
                }
            }
            return map;
        };

        const fireMap = generateFireMap(50, 50);
        const maxProb = Math.max(...fireMap.flat());

        const mockPrediction: PredictionResult = {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            request_params: requestData,
            predictions: [
                {
                    risk_level: maxProb > 0.8 ? 'Critical' : maxProb > 0.6 ? 'High' : maxProb > 0.3 ? 'Moderate' : 'Low',
                    max_fire_prob: maxProb,
                    estimated_area_sqkm: Math.floor(Math.random() * 1000 + 50),
                    key_findings: [
                        "Strong easterly winds are driving rapid spread.",
                        "High probability of ember transport towards populated areas.",
                        "Critical fuel dryness levels detected via satellite.",
                    ],
                    fire_probability_map: fireMap,
                },
            ],
        }

        const mockMetrics: QuantumMetrics = {
            synthesis: {
                provider: 'classiq',
                qubit_count: requestData.includeEmberAnalysis ? 32 : 16,
                depth: Math.floor(Math.random() * 200 + 50),
                gate_count: Math.floor(Math.random() * 5000 + 1000),
                synthesis_time: Math.random() * 5 + 1,
            },
            execution: {
                provider: requestData.useQuantumHardware ? 'IonQ Aria' : 'Classiq Cloud Simulator',
                shots: 8192,
                execution_time: Math.random() * 15 + 5,
                result_confidence: Math.random() * 0.1 + 0.89,
            },
            distribution: {
                '|01101⟩': 0.35,
                '|10110⟩': 0.28,
                '|01111⟩': 0.15,
                '|11001⟩': 0.12,
                'other': 0.10
            }
        }

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 2500));

        return NextResponse.json({
            prediction: mockPrediction,
            quantum_metrics: mockMetrics
        })

    } catch (error) {
        console.error('[API PREDICT ERROR]', error);
        return NextResponse.json({ error: 'Failed to process prediction request.' }, { status: 500 })
    }
}