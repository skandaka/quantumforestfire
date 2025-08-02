'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import {
    AlertTriangle, BarChart3, ChevronLeft, ChevronRight, Cpu, Flame,
    Info, Layers, Play, Settings, SlidersHorizontal, Wind, Zap, Loader2, XCircle, CheckCircle
} from 'lucide-react'
import { useQuantumPrediction } from '@/hooks/useQuantumPrediction'
import useRealTimeData from '@/hooks/useRealTimeData';
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AlertPanel } from '@/components/dashboard/AlertPanel'
import toast from 'react-hot-toast'
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { cn } from '@/lib/utils'

const MapView = dynamic(
    () => import('@/components/maps/MapView').then(mod => mod.MapView),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-gray-950">
                <div className="text-center text-gray-400">
                    <Loader2 className="h-12 w-12 animate-spin text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Initializing Geospatial Interface...</p>
                    <p className="text-sm">Loading multi-layer map data.</p>
                </div>
            </div>
        )
    }
)

interface PredictionRequest {
    model: string
    location: { latitude: number; longitude: number }
    radius: number
    timeHorizon: number
    useQuantumHardware: boolean
    includeEmberAnalysis: boolean
    hardwareProvider: string
}

export default function DashboardPage() {
    const [isLeftPanelOpen, setLeftPanelOpen] = useState(true)
    const [isRightPanelOpen, setRightPanelOpen] = useState(true)
    const [activeRightTab, setActiveRightTab] = useState<'info' | 'results'>('info')

    const [predictionParams, setPredictionParams] = useState<Omit<PredictionRequest, 'location' | 'radius'>>({
        model: 'ensemble',
        timeHorizon: 24,
        useQuantumHardware: false,
        includeEmberAnalysis: true,
        hardwareProvider: 'classiq_cloud_simulator'
    })

    const {
        runPrediction,
        currentPrediction,
        isPending,
        error: predictionError,
        systemStatus: quantumSystemStatus,
        quantumMetrics
    } = useQuantumPrediction()

    const {
        activeAlerts,
        fireData,
        weatherData,
        activeFireCount,
        highRiskAreas,
        systemStatus: dataSystemStatus,
        isLoadingFireData
    } = useRealTimeData()

    const realtimeMapData = useMemo(() => ({
        activeFires: fireData?.active_fires || [],
        weatherStations: weatherData?.stations || [],
        highRiskAreas: highRiskAreas || []
    }), [fireData, weatherData, highRiskAreas])

    const predictionStatus = useMemo(() => {
        if (isPending) return 'running'
        if (predictionError) return 'error'
        if (currentPrediction) return 'success'
        return 'idle'
    }, [isPending, predictionError, currentPrediction])

    useEffect(() => {
        if (currentPrediction) {
            setActiveRightTab('results')
            if (!isRightPanelOpen) {
                setRightPanelOpen(true)
            }
        }
    }, [currentPrediction, isRightPanelOpen])

    const handleRunPrediction = useCallback(async () => {
        const request: PredictionRequest = {
            ...predictionParams,
            location: { latitude: 39.7596, longitude: -121.6219 },
            radius: 50
        }
        toast.loading('Submitting job to Quantum Engine...', { id: 'prediction-toast' })
        try {
            await runPrediction(request)
            toast.success('Quantum Prediction Job Completed!', { id: 'prediction-toast' })
        } catch (error: any) {
            toast.error(`Prediction Failed: ${error.message || 'Unknown error'}`, { id: 'prediction-toast' })
        }
    }, [predictionParams, runPrediction])

    const handleParamChange = (key: keyof typeof predictionParams, value: any) => {
        setPredictionParams(prev => ({ ...prev, [key]: value }))
    }

    const ControlPanel = () => (
        <motion.div
            initial={false}
            animate={{ width: isLeftPanelOpen ? '350px' : '0px', opacity: isLeftPanelOpen ? 1 : 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="bg-gray-900/80 backdrop-blur-xl border-r border-gray-700/50 h-full flex flex-col overflow-hidden z-20" // z-20
        >
            <div className="p-4 border-b border-gray-700/50 flex-shrink-0"><h2 className="text-xl font-bold flex items-center gap-2"><SlidersHorizontal className="h-5 w-5 text-red-500" />Prediction Controls</h2></div>
            <div className="flex-grow p-4 space-y-6 overflow-y-auto">
                <div><label className="text-sm font-semibold text-gray-300 block mb-2">Quantum Model</label><Select value={predictionParams.model} onValueChange={(val) => handleParamChange('model', val)} options={[ { value: 'ensemble', label: 'Ensemble (Recommended)' }, { value: 'classiq_fire_spread', label: 'Classiq Fire Spread' }, { value: 'classiq_ember_dynamics', label: 'Classiq Ember Dynamics' }, { value: 'qiskit_fire_spread', label: 'Qiskit Fire Model' } ]} /></div>
                <div><label className="text-sm font-semibold text-gray-300 block mb-2">Hardware Provider</label><Select value={predictionParams.hardwareProvider} onValueChange={(val) => handleParamChange('hardwareProvider', val)} options={[ { value: 'classiq_cloud_simulator', label: 'Classiq Cloud Simulator' }, { value: 'classiq_quantum_device', label: 'Classiq Quantum Device' }, { value: 'local_simulator', label: 'Local Simulator' } ]} /></div>
                <div><label className="text-sm font-semibold text-gray-300 block mb-2">Time Horizon (Hours)</label><Select value={String(predictionParams.timeHorizon)} onValueChange={(val) => handleParamChange('timeHorizon', Number(val))} options={[ { value: '6', label: '6 Hours' }, { value: '12', label: '12 Hours' }, { value: '24', label: '24 Hours' }, { value: '48', label: '48 Hours' }, ]} /></div>
                <div><h3 className="text-md font-semibold text-gray-300 mb-3 border-t border-gray-700 pt-3">Advanced Options</h3><div className="space-y-3"><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="form-checkbox bg-gray-800 border-gray-600 rounded text-red-500 h-5 w-5 focus:ring-red-500/50" checked={predictionParams.includeEmberAnalysis} onChange={(e) => handleParamChange('includeEmberAnalysis', e.target.checked)} /><span className="text-sm">Include Quantum Ember Analysis</span></label><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" className="form-checkbox bg-gray-800 border-gray-600 rounded text-red-500 h-5 w-5 focus:ring-red-500/50" checked={predictionParams.useQuantumHardware} onChange={(e) => handleParamChange('useQuantumHardware', e.target.checked)} /><span className="text-sm">Use Real Quantum Hardware (if available)</span></label></div></div>
            </div>
            <div className="p-4 border-t border-gray-700/50 flex-shrink-0"><Button onClick={handleRunPrediction} disabled={isPending} className="w-full text-lg py-3 quantum-glow">{isPending ? ( <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Running Simulation...</> ) : ( <><Play className="w-5 h-5 mr-2" />Run Prediction</> )}</Button><div className="text-center mt-3 text-xs text-gray-400 flex items-center justify-center gap-2"><div className={cn('w-2 h-2 rounded-full', quantumSystemStatus === 'operational' ? 'bg-green-500' : 'bg-yellow-500')} />Quantum Engine: {quantumSystemStatus}</div></div>
        </motion.div>
    )

    const ResultsPanel = () => {
        const results = currentPrediction?.predictions?.[0];
        const metrics = quantumMetrics?.synthesis;
        const distribution = quantumMetrics?.distribution;
        if (predictionStatus === 'running') { return ( <div className="flex flex-col items-center justify-center h-full text-gray-400 p-4"><Loader2 className="h-10 w-10 animate-spin text-red-500 mb-4" /><h3 className="text-lg font-semibold">Processing Quantum Results...</h3><p className="text-sm text-center">Please wait while the quantum circuit output is being analyzed.</p></div> ); }
        if (predictionStatus === 'error') { return ( <div className="flex flex-col items-center justify-center h-full text-red-400 p-4"><XCircle className="h-10 w-10 mb-4" /><h3 className="text-lg font-semibold">Prediction Failed</h3><p className="text-sm text-center text-gray-400">{predictionError || 'An unknown error occurred.'}</p></div> ) }
        if (!results) { return ( <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4"><Info className="h-10 w-10 mb-4" /><h3 className="text-lg font-semibold">No Prediction Data</h3><p className="text-sm text-center">Run a prediction to see the results here.</p></div> ) }
        return (
            <div className="p-4 space-y-5">
                <div><h3 className="text-md font-bold text-gray-200 mb-2">Prediction Summary</h3><div className="bg-gray-800/50 p-3 rounded-lg space-y-2 text-sm"><div className="flex justify-between"><span>Risk Level:</span> <span className="font-bold text-red-400">{results.risk_level}</span></div><div className="flex justify-between"><span>Max Probability:</span> <span>{(results.max_fire_prob * 100).toFixed(2)}%</span></div><div className="flex justify-between"><span>Est. Area (km²):</span> <span>{results.estimated_area_sqkm}</span></div></div></div>
                {metrics && ( <div><h3 className="text-md font-bold text-gray-200 mb-2 flex items-center gap-2"><Cpu className="h-4 w-4" /> Quantum Circuit Metrics</h3><div className="bg-gray-800/50 p-3 rounded-lg space-y-2 text-sm"><div className="flex justify-between"><span>Qubits:</span> <span>{metrics.qubit_count}</span></div><div className="flex justify-between"><span>Circuit Depth:</span> <span>{metrics.depth}</span></div><div className="flex justify-between"><span>Gate Count:</span> <span>{metrics.gate_count}</span></div><div className="flex justify-between"><span>Synthesis Time:</span> <span>{metrics.synthesis_time?.toFixed(2)}s</span></div></div></div> )}
                {distribution && ( <div><h3 className="text-md font-bold text-gray-200 mb-2 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Probability Distribution</h3><div className="bg-gray-800/50 p-3 rounded-lg"><ResponsiveContainer width="100%" height={150}><BarChart data={Object.entries(distribution).map(([name, probability]) => ({ name, probability }))}><XAxis dataKey="name" stroke="#888" fontSize={10} /><YAxis stroke="#888" fontSize={10} /><Tooltip cursor={{ fill: 'rgba(255,255,255,0.1)' }} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #4b5563' }} /><Bar dataKey="probability" fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div></div> )}
            </div>
        )
    }

    const InfoPanel = () => (
        <div className="p-4 space-y-4">
            <div><h3 className="text-md font-bold text-gray-200 mb-2">Live Metrics</h3><div className="space-y-2"><MetricCard title="Active Fires" value={isLoadingFireData ? '...' : activeFireCount} icon={<Flame className="h-4 w-4" />} className="bg-gray-800/50 p-2" /><MetricCard title="Avg. Wind" value={isLoadingFireData ? '...' : `${weatherData?.current_conditions?.avg_wind_speed || 0} mph`} icon={<Wind className="h-4 w-4" />} className="bg-gray-800/50 p-2" /><MetricCard title="High Risk Zones" value={isLoadingFireData ? '...' : highRiskAreas?.length || 0} icon={<AlertTriangle className="h-4 w-4" />} className="bg-gray-800/50 p-2" /></div></div>
            <div><h3 className="text-md font-bold text-gray-200 mb-2 border-t border-gray-700 pt-3">Live Alerts</h3><AlertPanel alerts={activeAlerts} /></div>
        </div>
    )

    return (
        <div className="h-screen w-screen bg-black text-white flex overflow-hidden">
            <ControlPanel />
            <main className="flex-1 flex flex-col relative">
                {/* FIX: Add z-index to ensure this is above the map but below the header */}
                <button
                    onClick={() => setLeftPanelOpen(!isLeftPanelOpen)}
                    className="absolute top-1/2 -translate-y-1/2 left-0 z-30 bg-gray-800/80 hover:bg-red-600/80 p-2 rounded-r-lg transition-colors"
                >
                    {isLeftPanelOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </button>
                <div className="flex-grow relative z-10">
                    <MapView
                        predictionData={currentPrediction}
                        realtimeData={realtimeMapData}
                    />
                </div>
            </main>
            <AnimatePresence>
                {isRightPanelOpen && (
                    <motion.div
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: '350px', opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="bg-gray-900/80 backdrop-blur-xl border-l border-gray-700/50 h-full flex flex-col overflow-hidden z-20" // z-20
                    >
                        <div className="p-2 border-b border-gray-700/50 flex-shrink-0"><div className="flex bg-gray-800 rounded-lg p-1"><button onClick={() => setActiveRightTab('info')} className={cn( "flex-1 py-1.5 text-sm rounded-md flex items-center justify-center gap-2 transition-colors", activeRightTab === 'info' ? 'bg-red-600/80 text-white' : 'text-gray-300 hover:bg-gray-700' )}><Info className="h-4 w-4" /> Info</button><button onClick={() => setActiveRightTab('results')} className={cn( "flex-1 py-1.5 text-sm rounded-md flex items-center justify-center gap-2 transition-colors", activeRightTab === 'results' ? 'bg-red-600/80 text-white' : 'text-gray-300 hover:bg-gray-700' )}><BarChart3 className="h-4 w-4" /> Results</button></div></div>
                        <div className="flex-grow overflow-y-auto">
                            {activeRightTab === 'info' ? <InfoPanel /> : <ResultsPanel />}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* FIX: Add z-index to ensure this is above the map but below the header */}
            <button
                onClick={() => setRightPanelOpen(!isRightPanelOpen)}
                className="absolute top-1/2 -translate-y-1/2 right-0 z-30 bg-gray-800/80 hover:bg-red-600/80 p-2 rounded-l-lg transition-colors"
            >
                {isRightPanelOpen ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
        </div>
    )
}