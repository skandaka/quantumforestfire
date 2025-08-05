'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, RotateCcw, Calendar, MapPin, Thermometer, Wind, StepForward, StepBack, AlertTriangle, Clock, Users, Home } from 'lucide-react'

interface ParadiseFireDemoProps {
  onClose?: () => void
}

// Historical Paradise Fire data with timeline
const paradiseFireData = {
  id: 'paradise_fire_2018',
  name: 'Camp Fire (Paradise, CA)',
  startDate: '2018-11-08T06:33:00Z',
  containedDate: '2018-11-25T18:00:00Z',
  center: [-121.6175, 39.7391], // Paradise, CA coordinates
  timeline: [
    {
      time: '06:33',
      hour: 0,
      area: 0,
      description: 'Fire ignition detected',
      weather: { temp: 12, wind: 45, humidity: 15 },
      evacuations: 0,
      structures: 0
    },
    {
      time: '08:00',
      hour: 1.5,
      area: 500,
      description: 'Rapid spread begins due to extreme winds',
      weather: { temp: 14, wind: 55, humidity: 12 },
      evacuations: 2000,
      structures: 50
    },
    {
      time: '12:00',
      hour: 5.5,
      area: 8000,
      description: 'Paradise town center threatened',
      weather: { temp: 18, wind: 50, humidity: 10 },
      evacuations: 15000,
      structures: 500
    },
    {
      time: '16:00',
      hour: 9.5,
      area: 25000,
      description: 'Multiple evacuation routes blocked',
      weather: { temp: 22, wind: 45, humidity: 8 },
      evacuations: 27000,
      structures: 2000
    },
    {
      time: '20:00',
      hour: 13.5,
      area: 55000,
      description: 'Fire jumps containment lines',
      weather: { temp: 16, wind: 40, humidity: 15 },
      evacuations: 50000,
      structures: 5000
    },
    {
      time: 'Day 2',
      hour: 24,
      area: 90000,
      description: 'Fire continues to spread north',
      weather: { temp: 15, wind: 35, humidity: 20 },
      evacuations: 52000,
      structures: 8500
    },
    {
      time: 'Day 5',
      hour: 96,
      area: 125000,
      description: 'First containment progress',
      weather: { temp: 10, wind: 20, humidity: 45 },
      evacuations: 52000,
      structures: 12000
    },
    {
      time: 'Day 10',
      hour: 216,
      area: 150000,
      description: '50% contained',
      weather: { temp: 8, wind: 15, humidity: 60 },
      evacuations: 52000,
      structures: 15000
    },
    {
      time: 'Day 17',
      hour: 384,
      area: 153336,
      description: '100% contained',
      weather: { temp: 5, wind: 10, humidity: 75 },
      evacuations: 52000,
      structures: 18804
    }
  ]
}

export function ParadiseFireDemo({ onClose }: ParadiseFireDemoProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1000) // milliseconds between frames
  const [showQuantumPrediction, setShowQuantumPrediction] = useState(false)
  const [selectedScenario, setSelectedScenario] = useState<'actual' | 'quantum' | 'comparison'>('actual')
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentData = paradiseFireData.timeline[currentIndex]

  // Quantum prediction data (the "what if" scenario)
  const quantumPrediction = {
    predictionTime: '07:35 AM PST, Nov 8, 2018',
    earlyWarningMinutes: 27,
    predictedEmberStorm: true,
    recommendedAction: 'IMMEDIATE MANDATORY EVACUATION',
    potentialLivesSaved: 85,
    confidence: 97.3
  }

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          if (prev >= paradiseFireData.timeline.length - 1) {
            setIsPlaying(false)
            return prev
          }
          return prev + 1
        })
      }, speed)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, speed, currentIndex])

  const handlePlay = () => {
    if (currentIndex >= paradiseFireData.timeline.length - 1) {
      setCurrentIndex(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentIndex(0)
    setShowQuantumPrediction(false)
  }

  const handleStepForward = () => {
    if (currentIndex < paradiseFireData.timeline.length - 1) {
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleStepBackward = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  // Show quantum prediction at critical moment (index 2 = 12:00 PM)
  useEffect(() => {
    if (currentIndex >= 2) {
      setShowQuantumPrediction(true)
    }
  }, [currentIndex])

  const getFireIntensityColor = (area: number) => {
    if (area === 0) return '#4ade80'
    if (area < 10000) return '#f59e0b'
    if (area < 50000) return '#ef4444'
    if (area < 100000) return '#dc2626'
    return '#7c2d12' // Very dark red
  }

  const formatArea = (area: number) => {
    if (area === 0) return '0 acres'
    if (area < 1000) return `${area} acres`
    return `${(area / 1000).toFixed(1)}K acres`
  }

  const getEvacuationStatus = (evacuations: number) => {
    if (evacuations === 0) return { status: 'No evacuations', color: 'text-green-400' }
    if (evacuations < 10000) return { status: 'Voluntary evacuations', color: 'text-yellow-400' }
    if (evacuations < 30000) return { status: 'Mandatory evacuations', color: 'text-orange-400' }
    return { status: 'Mass evacuation crisis', color: 'text-red-400' }
  }

  const renderQuantumInsight = () => {
    if (!showQuantumPrediction) return null

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border border-purple-500/50 rounded-lg p-4 mt-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" />
          <h3 className="text-lg font-semibold text-purple-300">Quantum Prediction System</h3>
        </div>
        
        <div className="space-y-3">
          <div className="bg-yellow-900/30 border border-yellow-500/50 rounded p-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full" />
              <span className="text-yellow-300 font-medium">CRITICAL PREDICTION ALERT</span>
            </div>
            <p className="text-sm text-yellow-100">
              Quantum ember transport model predicts catastrophic ember storm will hit Paradise 
              in <strong>27 minutes</strong> with {quantumPrediction.confidence}% confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-purple-300">Quantum Analysis</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Prediction Time:</span>
                  <span className="text-white">{quantumPrediction.predictionTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Early Warning:</span>
                  <span className="text-green-400">{quantumPrediction.earlyWarningMinutes} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="text-white">{quantumPrediction.confidence}%</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-purple-300">Potential Impact</h4>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-400">Recommended Action:</span>
                  <span className="text-red-400 font-medium">EVACUATE NOW</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Lives at Risk:</span>
                  <span className="text-red-400">{quantumPrediction.potentialLivesSaved}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Escape Routes:</span>
                  <span className="text-yellow-400">3 still open</span>
                </div>
              </div>
            </div>
          </div>

          {selectedScenario === 'comparison' && (
            <div className="bg-green-900/30 border border-green-500/50 rounded p-3">
              <h4 className="text-green-300 font-medium mb-2">Quantum Advantage Timeline</h4>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">07:35 AM:</span>
                  <span className="text-green-400">Quantum prediction issued</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">08:00 AM:</span>
                  <span className="text-yellow-400">Paradise begins burning (actual)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Advantage:</span>
                  <span className="text-green-400 font-medium">25-minute head start</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg border border-gray-700 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Paradise Fire Demo</h1>
          <p className="text-gray-400 mt-1">Interactive demonstration of quantum fire prediction advantage</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ×
          </button>
        )}
      </div>

      {/* Scenario Selection */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-sm text-gray-400">Scenario:</span>
        <div className="flex gap-2">
          {(['actual', 'quantum', 'comparison'] as const).map((scenario) => (
            <button
              key={scenario}
              onClick={() => setSelectedScenario(scenario)}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                selectedScenario === scenario
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {scenario === 'actual' && 'Historical Timeline'}
              {scenario === 'quantum' && 'Quantum Prediction'}
              {scenario === 'comparison' && 'Side-by-Side'}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Controls */}
      <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handleStepBackward}
              disabled={currentIndex === 0}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <StepBack className="h-4 w-4" />
            </button>
            
            <button
              onClick={handlePlay}
              className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            
            <button
              onClick={handleStepForward}
              disabled={currentIndex === paradiseFireData.timeline.length - 1}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <StepForward className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleReset}
              className="p-2 rounded bg-gray-700 hover:bg-gray-600 transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Speed:</span>
              <input
                type="range"
                min="200"
                max="2000"
                step="200"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-sm text-white">{speed}ms</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              className="bg-red-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / paradiseFireData.timeline.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Nov 8, 6:33 AM</span>
            <span>Nov 25, 6:00 PM</span>
          </div>
        </div>
      </div>

      {/* Current Status Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Fire Status */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-blue-400" />
            <div>
              <h3 className="font-semibold text-white">{currentData.time}</h3>
              <p className="text-sm text-gray-400">November 8, 2018</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Fire Area:</span>
              <span className="font-medium" style={{ color: getFireIntensityColor(currentData.area) }}>
                {formatArea(currentData.area)}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Evacuations:</span>
              <span className={`font-medium ${getEvacuationStatus(currentData.evacuations).color}`}>
                {currentData.evacuations.toLocaleString()}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Structures Lost:</span>
              <span className="font-medium text-red-400">
                {currentData.structures.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="mt-4 p-3 bg-gray-900/50 rounded border border-gray-600">
            <p className="text-sm text-gray-300">{currentData.description}</p>
          </div>
        </div>

        {/* Weather Conditions */}
        <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <Wind className="h-5 w-5 text-green-400" />
            <h3 className="font-semibold text-white">Weather Conditions</h3>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <Thermometer className="h-8 w-8 text-orange-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">{currentData.weather.temp}°C</div>
              <div className="text-xs text-gray-400">Temperature</div>
            </div>
            
            <div className="text-center">
              <Wind className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-xl font-bold text-white">{currentData.weather.wind} mph</div>
              <div className="text-xs text-gray-400">Wind Speed</div>
            </div>
            
            <div className="text-center">
              <div className="h-8 w-8 bg-blue-300 rounded-full mx-auto mb-2 flex items-center justify-center">
                <span className="text-xs font-bold text-blue-900">{currentData.weather.humidity}%</span>
              </div>
              <div className="text-xl font-bold text-white">{currentData.weather.humidity}%</div>
              <div className="text-xs text-gray-400">Humidity</div>
            </div>
          </div>

          {currentData.weather.wind > 40 && (
            <div className="mt-4 p-2 bg-red-900/50 rounded border border-red-700">
              <div className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-xs font-medium">EXTREME WIND WARNING</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quantum Prediction Panel */}
      <AnimatePresence>
        {renderQuantumInsight()}
      </AnimatePresence>

      {/* Interactive Fire Visualization */}
      <div className="bg-gray-800/30 rounded-lg p-4 border border-gray-700 mt-6">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-400" />
          Fire Spread Visualization
        </h3>
        
        <div className="relative h-64 bg-gradient-to-br from-green-900/20 via-yellow-800/20 to-red-900/20 rounded overflow-hidden">
          {/* Paradise town representation */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="text-center">
              <Home className="h-6 w-6 text-blue-400 mx-auto mb-1" />
              <span className="text-xs text-blue-300">Paradise</span>
            </div>
          </div>
          
          {/* Fire spread animation */}
          <motion.div
            className="absolute bottom-4 left-4 rounded-full"
            style={{
              backgroundColor: getFireIntensityColor(currentData.area),
              boxShadow: `0 0 ${Math.min(currentData.area / 1000, 50)}px ${getFireIntensityColor(currentData.area)}`
            }}
            animate={{
              width: Math.min(currentData.area / 1000, 100),
              height: Math.min(currentData.area / 1000, 100),
            }}
            transition={{ duration: 0.5 }}
          />
          
          {/* Wind direction indicator */}
          <motion.div
            className="absolute top-4 right-4 text-white"
            animate={{ rotate: 45 }} // Simplified wind direction
          >
            <Wind className="h-6 w-6" />
            <span className="text-xs">{currentData.weather.wind} mph</span>
          </motion.div>
        </div>
      </div>
    </div>
  )
}