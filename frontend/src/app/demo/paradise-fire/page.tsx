'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, AlertTriangle, Clock, Users, Home, Wind } from 'lucide-react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import { Slider } from '@/components/ui/Slider'
import { useParadiseFireDemo } from '@/hooks/useParadiseFireDemo'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const FireVisualization3D = dynamic(
  () => import('@/components/visualization/FireVisualization3D').then(mod => ({ default: mod.FireVisualization3D })),
  { ssr: false }
)

const MapView = dynamic(
  () => import('@/components/dashboard/MapView'),
  { ssr: false }
)

// Timeline events
const timelineEvents = [
  { time: '06:15', event: 'PG&E transmission line failure near Pulga', type: 'origin' },
  { time: '06:30', event: 'Camp Fire ignition confirmed', type: 'fire' },
  { time: '07:00', event: 'Fire reaches 10 acres', type: 'fire' },
  { time: '07:35', event: 'QUANTUM DETECTION: Ember jump across Feather River canyon', type: 'quantum' },
  { time: '07:48', event: 'First evacuation order for Pulga', type: 'evacuation' },
  { time: '08:00', event: 'Paradise ignition - spot fires reported', type: 'critical' },
  { time: '08:05', event: 'Paradise evacuation order issued', type: 'evacuation' },
  { time: '09:35', event: 'Entire town of Paradise under evacuation', type: 'evacuation' },
  { time: '10:45', event: 'Paradise hospital evacuated', type: 'critical' }
]

export default function ParadiseFireDemoPage() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState('06:15')
  const [selectedView, setSelectedView] = useState<'3d' | 'map'>('3d')
  const [showQuantumPrediction, setShowQuantumPrediction] = useState(true)
  const [demoSpeed, setDemoSpeed] = useState(1)

  const {
    runDemo,
    currentState,
    quantumPrediction,
    classicalPrediction,
    isPending
  } = useParadiseFireDemo()

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        const [hours, minutes] = prev.split(':').map(Number)
        const totalMinutes = hours * 60 + minutes + (5 * demoSpeed)

        if (totalMinutes >= 11 * 60) {
          setIsPlaying(false)
          return '10:45'
        }

        const newHours = Math.floor(totalMinutes / 60)
        const newMinutes = totalMinutes % 60
        return `${String(newHours).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`
      })
    }, 1000 / demoSpeed)

    return () => clearInterval(interval)
  }, [isPlaying, demoSpeed])

  // Get current event
  const getCurrentEvent = () => {
    return timelineEvents.find(event => event.time <= currentTime) || timelineEvents[0]
  }

  const handlePlayPause = () => {
    if (!isPlaying && currentTime === '10:45') {
      handleReset()
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentTime('06:15')
  }

  const currentEvent = getCurrentEvent()
  const isQuantumMoment = currentTime >= '07:35' && currentTime < '08:00'

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/80 backdrop-blur sticky top-0 z-50">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Paradise Fire Demo - November 8, 2018</h1>
              <p className="text-sm text-gray-400 mt-1">
                Experience how quantum computing could have saved 85 lives
              </p>
            </div>

            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedView(selectedView === '3d' ? 'map' : '3d')}
              >
                {selectedView === '3d' ? 'Map View' : '3D View'}
              </Button>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showQuantumPrediction}
                  onChange={(e) => setShowQuantumPrediction(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Show Quantum Prediction</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Timeline Sidebar */}
        <div className="w-80 border-r border-gray-800 bg-black/50 backdrop-blur overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-4">Timeline</h2>

            {/* Current Time Display */}
            <div className="glass rounded-lg p-4 mb-6">
              <div className="text-3xl font-bold mb-2">{currentTime}</div>
              <div className="text-sm text-gray-400">November 8, 2018</div>
            </div>

            {/* Playback Controls */}
            <div className="flex items-center gap-2 mb-6">
              <Button
                size="sm"
                onClick={handlePlayPause}
                className="flex-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Play
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleReset}
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>

            {/* Speed Control */}
            <div className="mb-6">
              <label className="text-sm text-gray-400">Playback Speed: {demoSpeed}x</label>
              <Slider
                value={[demoSpeed]}
                onValueChange={([value]) => setDemoSpeed(value)}
                min={1}
                max={10}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Timeline Events */}
            <div className="space-y-3">
              {timelineEvents.map((event, index) => {
                const isPast = event.time <= currentTime
                const isCurrent = event === currentEvent

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: isPast ? 1 : 0.3, x: 0 }}
                    className={`
                      relative pl-8 py-2 border-l-2 
                      ${isCurrent ? 'border-red-500' : isPast ? 'border-gray-600' : 'border-gray-800'}
                    `}
                  >
                    <div className={`
                      absolute -left-2 top-3 w-4 h-4 rounded-full
                      ${event.type === 'quantum' ? 'bg-purple-500' : 
                        event.type === 'critical' ? 'bg-red-500' :
                        event.type === 'evacuation' ? 'bg-orange-500' :
                        event.type === 'fire' ? 'bg-yellow-500' : 'bg-gray-500'}
                    `} />

                    <div className="text-sm font-semibold">{event.time}</div>
                    <div className={`text-sm ${isPast ? 'text-gray-300' : 'text-gray-500'}`}>
                      {event.event}
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Key Stats */}
            <div className="mt-8 space-y-4">
              <div className="glass rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className="text-2xl font-bold">85</span>
                </div>
                <div className="text-sm text-gray-400">Lives Lost</div>
              </div>

              <div className="glass rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Home className="w-5 h-5 text-gray-400" />
                  <span className="text-2xl font-bold">18,804</span>
                </div>
                <div className="text-sm text-gray-400">Structures Destroyed</div>
              </div>

              <div className="glass rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Wind className="w-5 h-5 text-gray-400" />
                  <span className="text-2xl font-bold">50+ mph</span>
                </div>
                <div className="text-sm text-gray-400">Wind Speed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="flex-1 relative">
          {selectedView === '3d' ? (
            <FireVisualization3D
              predictionData={currentState}
              showEmbers={true}
              showQuantumField={showQuantumPrediction}
              showTerrain={true}
            />
          ) : (
            <MapView
              fireData={currentState?.fire}
              predictionData={showQuantumPrediction ? quantumPrediction : classicalPrediction}
              center={[39.7596, -121.6219]}
              zoom={11}
              showEmberPrediction={currentTime >= '07:35'}
            />
          )}

          {/* Quantum Alert Overlay */}
          <AnimatePresence>
            {isQuantumMoment && showQuantumPrediction && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20"
              >
                <div className="bg-purple-900/90 border border-purple-500 rounded-lg p-6 max-w-md quantum-glow">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertTriangle className="w-6 h-6 text-purple-400" />
                    <h3 className="text-lg font-bold">Quantum Detection Alert</h3>
                  </div>
                  <p className="text-sm mb-4">
                    Quantum ember dynamics model detecting massive ember transport across
                    Feather River canyon. Paradise ignition imminent.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Detection Time:</span>
                      <span className="font-semibold">7:35 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Predicted Ignition:</span>
                      <span className="font-semibold text-orange-400">8:00 AM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Early Warning:</span>
                      <span className="font-semibold text-green-400">25 minutes</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comparison Panel */}
          <div className="absolute bottom-4 left-4 right-4 glass rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full" />
                  Quantum Prediction
                </h4>
                <div className="space-y-1 text-sm">
                  <div>Ember jump detected: <span className="text-purple-400">7:35 AM</span></div>
                  <div>Paradise threat level: <span className="text-red-400">EXTREME</span></div>
                  <div>Evacuation recommended: <span className="text-green-400">7:40 AM</span></div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-500 rounded-full" />
                  Classical Model
                </h4>
                <div className="space-y-1 text-sm">
                  <div>Ember jump detected: <span className="text-gray-400">Not detected</span></div>
                  <div>Paradise threat level: <span className="text-yellow-400">LOW</span></div>
                  <div>Evacuation recommended: <span className="text-red-400">8:05 AM</span></div>
                </div>
              </div>
            </div>

            {currentTime >= '08:00' && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-500">
                    {showQuantumPrediction ? '85 Lives Saved' : '85 Lives Lost'}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">
                    {showQuantumPrediction
                      ? '25 minutes of early warning enabled full evacuation'
                      : 'Insufficient warning time for evacuation'
                    }
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}