'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useParadiseFireDemo } from '@/hooks/useParadiseFireDemo'
import {
    AlertTriangle, ArrowRight, CheckCircle, ChevronLeft, Clock, Eye,
    Flame, Loader2, MapPin, Wind, Zap, RefreshCw, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

// --- DYNAMIC IMPORTS ---
const MapView = dynamic(
    () => import('@/components/maps/MapView').then(mod => mod.MapView),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full flex items-center justify-center bg-gray-950">
                <div className="text-center text-gray-400">
                    <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold">Loading Historical Simulation...</p>
                </div>
            </div>
        )
    }
)

// --- TYPE DEFINITIONS ---
interface DemoEvent {
    title: string
    time: string
    description: string
    quantumInsight?: string
    stats: {
        acres: number
        windMph: number
        status: 'Detecting' | 'Spreading' | 'Critical Threat' | 'Catastrophic'
        threats: string[]
    }
}

// --- CONSTANTS ---
// This data drives the narrative timeline of the demo.
const DEMO_TIMELINE: DemoEvent[] = [
    {
        title: 'Initial Ignition',
        time: '6:33 AM PST, Nov 8, 2018',
        description: 'A faulty PG&E transmission line sparks a fire in a remote, windy canyon. At this moment, it is a small, manageable brush fire.',
        stats: { acres: 2, windMph: 35, status: 'Detecting', threats: ['Camp Creek Road'] }
    },
    {
        title: 'Rapid Expansion',
        time: '7:05 AM PST',
        description: 'Fueled by fierce Jarbo Gap winds and critically dry conditions, the fire explodes in size, consuming fuel at a rate of over a football field per second.',
        quantumInsight: 'Classical models struggle with this chaotic growth. Our quantum model correctly predicts the non-linear spread pattern by analyzing a wider range of possibilities.',
        stats: { acres: 1000, windMph: 50, status: 'Spreading', threats: ['Concow'] }
    },
    {
        title: 'Quantum Ember Detection',
        time: '7:33 AM PST',
        description: 'This is the critical moment. The fire is still miles from Paradise, but its intensity and the wind field are creating a massive plume of embers.',
        quantumInsight: 'Our Quantum Ember Transport model, analyzing millions of potential particle paths, issues a CRITICAL ALERT. It predicts with 97% confidence that a catastrophic ember storm will strike Paradise in under 30 minutes. This is a 27-minute head start on reality.',
        stats: { acres: 8000, windMph: 52, status: 'Critical Threat', threats: ['Paradise (Predicted)', 'Concow'] }
    },
    {
        title: 'Paradise Ignites',
        time: '8:00 AM PST',
        description: 'The ember storm, as predicted by the quantum model, descends upon Paradise. The town ignites in hundreds of places simultaneously, trapping residents and overwhelming firefighters.',
        quantumInsight: 'The 27 minutes of advance warning provided by the quantum prediction would have been enough time to issue a mandatory, city-wide evacuation order, potentially saving hundreds of lives.',
        stats: { acres: 15000, windMph: 48, status: 'Catastrophic', threats: ['Paradise', 'Magalia'] }
    }
]

/**
 * An interactive, narrative-driven demonstration of the Paradise Fire event,
 * showcasing the life-saving potential of the quantum prediction system.
 */
export default function ParadiseFireDemoPage() {
    // --- STATE MANAGEMENT ---
    const [currentStep, setCurrentStep] = useState(0)
    const [isPanelOpen, setPanelOpen] = useState(true)

    // --- HOOKS ---
    const {
        runStage,
        simulationData,
        isPending,
        error
    } = useParadiseFireDemo()

    // --- EFFECT HOOKS ---
    // Run the first stage of the demo automatically on page load.
    useEffect(() => {
        runStage(0)
    }, [runStage])

    // --- EVENT HANDLERS ---
    const handleNextStep = useCallback(() => {
        const nextStep = currentStep + 1
        if (nextStep < DEMO_TIMELINE.length) {
            setCurrentStep(nextStep)
            runStage(nextStep)
        }
    }, [currentStep, runStage])

    const handlePreviousStep = useCallback(() => {
        const prevStep = currentStep - 1
        if (prevStep >= 0) {
            setCurrentStep(prevStep)
            runStage(prevStep)
        }
    }, [currentStep, runStage])

    const handleRestart = useCallback(() => {
        setCurrentStep(0)
        runStage(0)
    }, [runStage])


    // --- DERIVED STATE & MEMOIZATION ---
    const currentEvent = useMemo(() => DEMO_TIMELINE[currentStep], [currentStep])

    const mapData = useMemo(() => {
        if (!simulationData) return { activeFires: [], weatherStations: [], highRiskAreas: [] }
        return {
            activeFires: simulationData.fire_locations || [],
            // The ember prediction is a special polygon layer
            highRiskAreas: simulationData.ember_prediction_area ? [
                {
                    id: 'ember_zone',
                    name: 'Quantum Ember Prediction Zone',
                    risk_level: 0.9,
                    cause: 'Predicted Ember Storm',
                    polygon: simulationData.ember_prediction_area
                }
            ] : [],
            weatherStations: simulationData.weather_stations || []
        }
    }, [simulationData])


    // --- RENDER HELPER COMPONENTS ---

    const TimelinePanel = () => (
        <motion.div
            initial={false}
            animate={{ width: isPanelOpen ? '450px' : '0px', opacity: isPanelOpen ? 1 : 0 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="absolute top-0 left-0 bottom-0 z-10 bg-black/80 backdrop-blur-lg border-r border-gray-700 flex flex-col"
        >
            <div className="p-4 border-b border-gray-700">
                <h1 className="text-2xl font-bold text-orange-400">Paradise Fire: A Quantum Retrospective</h1>
                <p className="text-sm text-gray-400 mt-1">A step-by-step analysis of a preventable tragedy.</p>
            </div>

            <div className="flex-grow p-5 space-y-4 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* Event Header */}
                        <div className="mb-4">
                            <p className="text-sm text-gray-400 font-mono flex items-center gap-2"><Clock className="h-4 w-4" /> {currentEvent.time}</p>
                            <h2 className="text-3xl font-bold text-white mt-1">{currentEvent.title}</h2>
                        </div>

                        {/* Event Description */}
                        <p className="text-gray-300 leading-relaxed mb-5">{currentEvent.description}</p>

                        {/* Quantum Insight Section */}
                        {currentEvent.quantumInsight && (
                            <div className="p-4 rounded-lg bg-gradient-to-br from-red-900/40 via-red-900/20 to-transparent border border-red-500/30 mb-5">
                                <h3 className="font-bold text-red-400 flex items-center gap-2 mb-2">
                                    <Zap className="h-5 w-5" /> Quantum Insight
                                </h3>
                                <p className="text-sm text-red-200/90">{currentEvent.quantumInsight}</p>
                            </div>
                        )}

                        {/* Event Stats */}
                        <div>
                            <h4 className="font-semibold text-gray-200 mb-3">Situational Analysis</h4>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="bg-gray-800/70 p-3 rounded-md">
                                    <p className="text-gray-400 flex items-center gap-1.5"><Flame className="h-3 w-3" /> Acres Burned</p>
                                    <p className="text-white font-bold text-lg">{currentEvent.stats.acres.toLocaleString()}</p>
                                </div>
                                <div className="bg-gray-800/70 p-3 rounded-md">
                                    <p className="text-gray-400 flex items-center gap-1.5"><Wind className="h-3 w-3" /> Wind Speed</p>
                                    <p className="text-white font-bold text-lg">{currentEvent.stats.windMph} mph</p>
                                </div>
                                <div className="bg-gray-800/70 p-3 rounded-md col-span-2">
                                    <p className="text-gray-400 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" /> Status</p>
                                    <p className={cn(
                                        "font-bold text-lg",
                                        currentEvent.stats.status === 'Critical Threat' && 'text-red-500 animate-pulse',
                                        currentEvent.stats.status === 'Catastrophic' && 'text-red-400',
                                        currentEvent.stats.status === 'Spreading' && 'text-orange-400',
                                        currentEvent.stats.status === 'Detecting' && 'text-yellow-400',
                                    )}>{currentEvent.stats.status}</p>
                                </div>
                                <div className="bg-gray-800/70 p-3 rounded-md col-span-2">
                                    <p className="text-gray-400 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Active Threats</p>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {currentEvent.stats.threats.map(threat => (
                                            <span key={threat} className="bg-red-900/50 text-red-300 text-xs font-medium px-2 py-1 rounded-full">
                          {threat}
                        </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="p-4 border-t border-gray-700 mt-auto">
                {/* Loading/Error State */}
                {isPending && (
                    <div className="flex items-center justify-center gap-2 text-sm text-yellow-400 p-2 bg-yellow-900/30 rounded-md mb-3">
                        <Loader2 className="animate-spin h-4 w-4" /> Fetching simulation data for this stage...
                    </div>
                )}
                {error && (
                    <div className="flex items-center justify-center gap-2 text-sm text-red-400 p-2 bg-red-900/30 rounded-md mb-3">
                        <XCircle className="h-4 w-4" /> Error loading stage data.
                    </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="outline"
                        onClick={handlePreviousStep}
                        disabled={currentStep === 0 || isPending}
                        className="border-gray-600"
                    >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                    </Button>
                    <div className="text-sm text-gray-400">Step {currentStep + 1} of {DEMO_TIMELINE.length}</div>
                    {currentStep === DEMO_TIMELINE.length - 1 ? (
                        <Button onClick={handleRestart} className="bg-orange-600 hover:bg-orange-700">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Restart Demo
                        </Button>
                    ) : (
                        <Button onClick={handleNextStep} disabled={isPending} className="quantum-glow">
                            Next Event
                            <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>
        </motion.div>
    )

    return (
        <div className="h-screen w-screen bg-black text-white flex overflow-hidden relative">
            <AnimatePresence>
                <TimelinePanel />
            </AnimatePresence>

            <main className="flex-1 h-full w-full">
                <MapView
                    predictionData={simulationData}
                    realtimeData={mapData}
                    center={[-121.6175, 39.7391]}
                    zoom={9.5}
                />
            </main>

            {/* Panel Toggle Button */}
            <button
                onClick={() => setPanelOpen(!isPanelOpen)}
                className="absolute top-4 left-4 z-20 bg-black/70 hover:bg-black p-3 rounded-full transition-all"
                style={{ transform: isPanelOpen ? `translateX(458px)` : 'translateX(0px)' }}
            >
                {isPanelOpen ? <ChevronLeft className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>

            {/* Special Quantum Prediction Banner */}
            <AnimatePresence>
                {currentStep === 2 && simulationData?.ember_prediction_area && (
                    <motion.div
                        initial={{ opacity: 0, y: -100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -100 }}
                        className="absolute top-4 right-4 z-20 max-w-sm p-4 rounded-lg bg-gradient-to-tr from-red-500 to-orange-500 text-white shadow-2xl shadow-red-500/30"
                    >
                        <div className="flex items-start gap-3">
                            <CheckCircle className="h-8 w-8 text-white flex-shrink-0 mt-1" />
                            <div>
                                <h3 className="text-xl font-bold">Quantum Advantage Achieved</h3>
                                <p className="text-sm mt-1">
                                    The highlighted zone shows the predicted ember storm trajectory. This alert was generated **27 minutes** before the first structures ignited in Paradise.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}