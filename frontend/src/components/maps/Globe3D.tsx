'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useLoader, extend } from '@react-three/fiber'
import { OrbitControls, Text, Sphere, Html } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { Flame, Zap, AlertTriangle } from 'lucide-react'

// Extend Three.js with custom materials
extend({ ShaderMaterial: THREE.ShaderMaterial })

interface FirePoint {
  id: string
  lat: number
  lng: number
  intensity: number
  name: string
  acresBurned: number
  confidence: number
  detected: string
}

interface Globe3DProps {
  fires?: FirePoint[]
  autoRotate?: boolean
  className?: string
}

// Sample fire data (in real app, this would come from your API)
const sampleFires: FirePoint[] = [
  {
    id: 'ca-1',
    lat: 39.7391,
    lng: -121.6175,
    intensity: 0.9,
    name: 'Paradise Fire Zone',
    acresBurned: 12500,
    confidence: 0.87,
    detected: '2024-01-15T10:30:00Z'
  },
  {
    id: 'ca-2',
    lat: 34.0522,
    lng: -118.2437,
    intensity: 0.6,
    name: 'Los Angeles County',
    acresBurned: 3200,
    confidence: 0.92,
    detected: '2024-01-15T14:22:00Z'
  },
  {
    id: 'ca-3',
    lat: 37.7749,
    lng: -122.4194,
    intensity: 0.4,
    name: 'Bay Area Monitoring',
    acresBurned: 450,
    confidence: 0.76,
    detected: '2024-01-15T16:45:00Z'
  },
  {
    id: 'au-1',
    lat: -25.2744,
    lng: 133.7751,
    intensity: 0.8,
    name: 'Central Australia',
    acresBurned: 8900,
    confidence: 0.84,
    detected: '2024-01-15T08:15:00Z'
  },
  {
    id: 'br-1',
    lat: -14.2350,
    lng: -51.9253,
    intensity: 0.7,
    name: 'Amazon Basin',
    acresBurned: 15600,
    confidence: 0.89,
    detected: '2024-01-15T12:10:00Z'
  },
  {
    id: 'es-1',
    lat: 40.4637,
    lng: -3.7492,
    intensity: 0.5,
    name: 'Central Spain',
    acresBurned: 2100,
    confidence: 0.71,
    detected: '2024-01-15T11:30:00Z'
  }
]

// Convert lat/lng to 3D sphere coordinates
function latLngToVector3(lat: number, lng: number, radius = 5) {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

// Fire marker component
function FireMarker({ fire, onClick }: { fire: FirePoint; onClick: (fire: FirePoint) => void }) {
  const ref = useRef<THREE.Mesh>(null!)
  const position = latLngToVector3(fire.lat, fire.lng, 5.1)
  
  const color = useMemo(() => {
    if (fire.intensity > 0.8) return '#ff0000'
    if (fire.intensity > 0.6) return '#ff4400'
    if (fire.intensity > 0.4) return '#ff8800'
    return '#ffaa00'
  }, [fire.intensity])

  const scale = useMemo(() => {
    return 0.1 + (fire.intensity * 0.3)
  }, [fire.intensity])

  useFrame((state) => {
    if (ref.current) {
      // Pulsing animation
      const pulse = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 1
      ref.current.scale.setScalar(scale * pulse)
    }
  })

  return (
    <group position={position}>
      <mesh 
        ref={ref} 
        onClick={() => onClick(fire)}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
        }}
      >
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>
      
      {/* Fire glow effect */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshBasicMaterial 
          color={color} 
          transparent 
          opacity={0.3} 
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  )
}

// Earth globe component
function Earth() {
  const earthRef = useRef<THREE.Mesh>(null!)
  
  // Create earth texture (simple procedural for now)
  const earthTexture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    // Create a simple earth-like texture
    const gradient = ctx.createLinearGradient(0, 0, 0, 512)
    gradient.addColorStop(0, '#87CEEB') // Sky blue for ice caps
    gradient.addColorStop(0.3, '#228B22') // Forest green
    gradient.addColorStop(0.5, '#8B4513') // Brown for land
    gradient.addColorStop(0.7, '#228B22') // More green
    gradient.addColorStop(1, '#87CEEB') // Ice caps
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 1024, 512)
    
    // Add some random land masses
    ctx.fillStyle = '#654321'
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * 1024
      const y = Math.random() * 512
      const w = Math.random() * 100 + 20
      const h = Math.random() * 60 + 10
      ctx.fillRect(x, y, w, h)
    }
    
    return new THREE.CanvasTexture(canvas)
  }, [])

  useFrame(() => {
    if (earthRef.current) {
      earthRef.current.rotation.y += 0.001 // Slow rotation
    }
  })

  return (
    <mesh ref={earthRef}>
      <sphereGeometry args={[5, 64, 64]} />
      <meshStandardMaterial 
        map={earthTexture} 
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  )
}

// Atmosphere effect
function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[5.3, 64, 64]} />
      <meshBasicMaterial 
        color="#87CEEB" 
        transparent 
        opacity={0.1} 
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// Main Globe3D component
function Globe3DScene({ fires = sampleFires, onFireClick }: { 
  fires: FirePoint[]
  onFireClick: (fire: FirePoint) => void 
}) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4169E1" />
      
      {/* Earth and atmosphere */}
      <Earth />
      <Atmosphere />
      
      {/* Fire markers */}
      {fires.map((fire) => (
        <FireMarker key={fire.id} fire={fire} onClick={onFireClick} />
      ))}
      
      {/* Controls */}
      <OrbitControls 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        autoRotate={true}
        autoRotateSpeed={0.5}
        minDistance={7}
        maxDistance={20}
        target={[0, 0, 0]}
      />
    </>
  )
}

// Fire details popup
function FireDetailsPopup({ fire, onClose }: { 
  fire: FirePoint | null
  onClose: () => void 
}) {
  if (!fire) return null

  const getIntensityLabel = (intensity: number) => {
    if (intensity > 0.8) return 'Extreme'
    if (intensity > 0.6) return 'High'
    if (intensity > 0.4) return 'Moderate'
    return 'Low'
  }

  const getIntensityColor = (intensity: number) => {
    if (intensity > 0.8) return 'text-red-500'
    if (intensity > 0.6) return 'text-orange-500'
    if (intensity > 0.4) return 'text-yellow-500'
    return 'text-green-500'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="absolute top-4 right-4 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg p-4 max-w-sm z-10"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="text-white font-semibold">{fire.name}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-xl"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Intensity:</span>
          <span className={`font-semibold ${getIntensityColor(fire.intensity)}`}>
            {getIntensityLabel(fire.intensity)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Acres Burned:</span>
          <span className="text-white">{fire.acresBurned.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Confidence:</span>
          <span className="text-white">{(fire.confidence * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Location:</span>
          <span className="text-white text-xs">
            {fire.lat.toFixed(3)}°, {fire.lng.toFixed(3)}°
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Detected:</span>
          <span className="text-white text-xs">
            {new Date(fire.detected).toLocaleDateString()}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// Main export component
export function Globe3D({ fires = sampleFires, autoRotate = true, className = '' }: Globe3DProps) {
  const [selectedFire, setSelectedFire] = useState<FirePoint | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1500)
    return () => clearTimeout(timer)
  }, [])

  // Position camera over California initially
  const californiaPosition = useMemo(() => {
    const phi = (90 - 36.7783) * (Math.PI / 180) // California latitude
    const theta = (-119.4179 + 180) * (Math.PI / 180) // California longitude
    const radius = 12
    
    return [
      -radius * Math.sin(phi) * Math.cos(theta),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    ]
  }, [])

  if (isLoading) {
    return (
      <div className={`relative ${className}`}>
        <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-400">Loading global fire data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* 3D Globe Canvas */}
      <Canvas 
        camera={{ 
          position: californiaPosition as [number, number, number],
          fov: 50 
        }}
        style={{ background: 'linear-gradient(to bottom, #000011 0%, #000033 100%)' }}
      >
        <Globe3DScene 
          fires={fires} 
          onFireClick={setSelectedFire}
        />
      </Canvas>

      {/* Fire details popup */}
      <FireDetailsPopup 
        fire={selectedFire} 
        onClose={() => setSelectedFire(null)} 
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-orange-500" />
          Fire Intensity
        </h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-300">Extreme (80%+)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-gray-300">High (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-300">Moderate (40-60%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-300">Low (&lt;40%)</span>
          </div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-700">
          <p className="text-gray-400 text-xs">
            Click markers for details • Drag to rotate • Scroll to zoom
          </p>
        </div>
      </div>

      {/* Stats overlay */}
      <div className="absolute top-4 left-4 bg-gray-900/95 backdrop-blur border border-gray-700 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          Global Fire Status
        </h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Active Fires:</span>
            <span className="text-red-400 font-mono">{fires.length}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Total Acres:</span>
            <span className="text-orange-400 font-mono">
              {fires.reduce((sum, fire) => sum + fire.acresBurned, 0).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-400">Avg Confidence:</span>
            <span className="text-green-400 font-mono">
              {((fires.reduce((sum, fire) => sum + fire.confidence, 0) / fires.length) * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Globe3D
