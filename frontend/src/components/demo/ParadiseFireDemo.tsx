'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, Calendar, MapPin, Thermometer, Wind } from 'lucide-react'

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
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const currentData = paradiseFireData.timeline[currentIndex]

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
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
  }, [isPlaying, speed])

  const handlePlay = () => {
    if (currentIndex >= paradiseFireData.timeline.length - 1) {
      setCurrentIndex(0)
    }
    setIsPlaying(!isPlaying)
  }

  const handleReset = () => {
    setIsPlaying(false)
    setCurrentIndex(0)
  }

  const getFireIntensityColor = (area: number) => {
    if (area === 0) return '#4ade80' // Green for start
    if (area < 10000) return '#f59e0b' // Amber
    if (area < 50000) return '#ef4444' // Red
    if (area < 100000) return '#dc2626' // Dark red
    return '#7c2d12' // Very dark red
  }

  const formatArea = (area: number) => {
    if (area === 0) return '0 acres'
    if (area < 1000) return `${area} acres`
    return `${(area / 1000).toFixed(1)}K acres`
  }

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg border border-gray-700 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-orange-400 mb-2">
            {paradiseFireData.name}
          </h2>
          <p className="text-gray-400">November 8-25, 2018 • Historical Timeline Simulation</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Timeline Visualization */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Fire Progression Timeline</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Speed:</span>
            <select
              value={speed}
              onChange={(e) => setSpeed(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm"
            >
              <option value={3000}>Slow</option>
              <option value={1000}>Normal</option>
              <option value={500}>Fast</option>
            </select>
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative mb-4">
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div 
              className="h-3 rounded-full transition-all duration-300"
              style={{
                width: `${((currentIndex + 1) / paradiseFireData.timeline.length) * 100}%`,
                backgroundColor: getFireIntensityColor(currentData.area)
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Ignition</span>
            <span>Day 17 - Contained</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={handlePlay}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Step:</span>
            <input
              type="range"
              min="0"
              max={paradiseFireData.timeline.length - 1}
              value={currentIndex}
              onChange={(e) => {
                setCurrentIndex(Number(e.target.value))
                setIsPlaying(false)
              }}
              className="w-32"
            />
            <span className="text-sm text-gray-300 min-w-[60px]">
              {currentIndex + 1}/{paradiseFireData.timeline.length}
            </span>
          </div>
        </div>
      </div>

      {/* Current Status Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-gray-400">Time</span>
          </div>
          <div className="text-xl font-bold">{currentData.time}</div>
          <div className="text-sm text-gray-400">Hour {currentData.hour}</div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-4 h-4 text-red-400" />
            <span className="text-sm text-gray-400">Fire Size</span>
          </div>
          <div className="text-xl font-bold" style={{ color: getFireIntensityColor(currentData.area) }}>
            {formatArea(currentData.area)}
          </div>
          <div className="text-sm text-gray-400">
            {currentData.structures.toLocaleString()} structures
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-gray-400">Weather</span>
          </div>
          <div className="text-xl font-bold">{currentData.weather.wind} mph</div>
          <div className="text-sm text-gray-400">
            {currentData.weather.temp}°C, {currentData.weather.humidity}% humidity
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Thermometer className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-gray-400">Evacuations</span>
          </div>
          <div className="text-xl font-bold text-orange-400">
            {currentData.evacuations.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">people evacuated</div>
        </div>
      </div>

      {/* Current Description */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-6">
        <h4 className="font-semibold mb-2 text-orange-400">Current Situation</h4>
        <p className="text-gray-300">{currentData.description}</p>
      </div>

      {/* Fire Intensity Visualization */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
        <h4 className="font-semibold mb-4 text-orange-400">Fire Intensity Visualization</h4>
        <div className="relative h-32 bg-gradient-to-t from-green-900 to-gray-900 rounded overflow-hidden">
          <div 
            className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out"
            style={{
              height: `${Math.min(100, (currentData.area / 153336) * 100)}%`,
              background: `linear-gradient(to top, ${getFireIntensityColor(currentData.area)}, transparent)`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-bold text-lg drop-shadow-lg">
              {formatArea(currentData.area)}
            </span>
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
          <span>Ignition Point</span>
          <span>Peak: 153,336 acres</span>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-6 text-sm text-gray-500 bg-gray-800 p-3 rounded border border-gray-700">
        <p><strong>Note:</strong> This is a historical simulation of the Camp Fire (Paradise Fire) that occurred in November 2018. 
        Data includes actual timeline events, weather conditions, and evacuation information. This tragic fire resulted in 85 fatalities 
        and destroyed over 18,000 structures, making it one of the deadliest wildfires in California history.</p>
      </div>
    </div>
  )
}
