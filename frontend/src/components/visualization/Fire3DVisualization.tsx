'use client'

import React, { useRef, useMemo, useEffect, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Points, PointMaterial, OrbitControls, Text } from '@react-three/drei'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { Flame, Wind, Mountain, Zap } from 'lucide-react'

// --- TYPE DEFINITIONS ---
interface Fire3DVisualizationProps {
  fireData?: {
    center: [number, number]
    area: number
    intensity: number
    temperature: number
    windSpeed: number
    windDirection: number
  }
  weatherData?: {
    windSpeed: number
    windDirection: number
    temperature: number
    humidity: number
  }
  showEmberTrails?: boolean
  showQuantumField?: boolean
  terrain?: 'flat' | 'mountainous' | 'valley'
  className?: string
}

// --- PARTICLE SYSTEMS ---

// Fire Particles Component
function FireParticles({ intensity, area, temperature }: { intensity: number, area: number, temperature: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = Math.min(1000, Math.max(100, area / 10))
  
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Position in fire area
      const radius = Math.sqrt(Math.random()) * area / 100
      const angle = Math.random() * Math.PI * 2
      
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = Math.random() * 10 - 5
      positions[i3 + 2] = Math.sin(angle) * radius
      
      // Color based on temperature and height
      const height = positions[i3 + 1]
      const temp = temperature + height * 20
      
      if (temp > 1000) {
        colors[i3] = 1      // White hot
        colors[i3 + 1] = 1
        colors[i3 + 2] = 1
      } else if (temp > 800) {
        colors[i3] = 1      // Yellow
        colors[i3 + 1] = 1
        colors[i3 + 2] = 0.2
      } else if (temp > 500) {
        colors[i3] = 1      // Orange
        colors[i3 + 1] = 0.5
        colors[i3 + 2] = 0
      } else {
        colors[i3] = 1      // Red
        colors[i3 + 1] = 0.2
        colors[i3 + 2] = 0
      }
      
      // Initial velocities
      velocities[i3] = (Math.random() - 0.5) * 0.1
      velocities[i3 + 1] = Math.random() * 0.5 + 0.1
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.1
    }
    
    return { positions, colors, velocities }
  }, [particleCount, area, temperature])

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        
        // Update positions
        positions[i3] += particles.velocities[i3] * delta * 60
        positions[i3 + 1] += particles.velocities[i3 + 1] * delta * 60 * intensity
        positions[i3 + 2] += particles.velocities[i3 + 2] * delta * 60
        
        // Reset particles that go too high
        if (positions[i3 + 1] > 15) {
          const radius = Math.sqrt(Math.random()) * area / 100
          const angle = Math.random() * Math.PI * 2
          
          positions[i3] = Math.cos(angle) * radius
          positions[i3 + 1] = -5
          positions[i3 + 2] = Math.sin(angle) * radius
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

// Ember Particles Component
function EmberParticles({ windSpeed, windDirection, fireArea }: { windSpeed: number, windDirection: number, fireArea: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const emberCount = Math.min(500, Math.max(50, windSpeed * 10))
  
  const embers = useMemo(() => {
    const positions = new Float32Array(emberCount * 3)
    const colors = new Float32Array(emberCount * 3)
    const velocities = new Float32Array(emberCount * 3)
    
    const windRad = (windDirection * Math.PI) / 180
    const windX = Math.cos(windRad) * windSpeed * 0.1
    const windZ = Math.sin(windRad) * windSpeed * 0.1
    
    for (let i = 0; i < emberCount; i++) {
      const i3 = i * 3
      
      // Start from fire area
      const radius = Math.sqrt(Math.random()) * fireArea / 150
      const angle = Math.random() * Math.PI * 2
      
      positions[i3] = Math.cos(angle) * radius
      positions[i3 + 1] = Math.random() * 5
      positions[i3 + 2] = Math.sin(angle) * radius
      
      // Orange/red ember colors
      colors[i3] = 1
      colors[i3 + 1] = 0.3 + Math.random() * 0.4
      colors[i3 + 2] = 0
      
      // Wind-affected velocities
      velocities[i3] = windX + (Math.random() - 0.5) * 0.2
      velocities[i3 + 1] = Math.random() * 0.3 + 0.1
      velocities[i3 + 2] = windZ + (Math.random() - 0.5) * 0.2
    }
    
    return { positions, colors, velocities }
  }, [emberCount, windSpeed, windDirection, fireArea])

  useFrame((state, delta) => {
    if (pointsRef.current) {
      const positions = pointsRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < emberCount; i++) {
        const i3 = i * 3
        
        // Update positions with gravity and wind
        positions[i3] += embers.velocities[i3] * delta * 60
        positions[i3 + 1] += embers.velocities[i3 + 1] * delta * 60
        positions[i3 + 2] += embers.velocities[i3 + 2] * delta * 60
        
        // Apply gravity
        embers.velocities[i3 + 1] -= 0.02 * delta * 60
        
        // Reset embers that hit ground or go too far
        if (positions[i3 + 1] < -2 || Math.abs(positions[i3]) > 50 || Math.abs(positions[i3 + 2]) > 50) {
          const radius = Math.sqrt(Math.random()) * fireArea / 150
          const angle = Math.random() * Math.PI * 2
          
          positions[i3] = Math.cos(angle) * radius
          positions[i3 + 1] = Math.random() * 5
          positions[i3 + 2] = Math.sin(angle) * radius
          
          const windRad = (windDirection * Math.PI) / 180
          const windX = Math.cos(windRad) * windSpeed * 0.1
          const windZ = Math.sin(windRad) * windSpeed * 0.1
          
          embers.velocities[i3] = windX + (Math.random() - 0.5) * 0.2
          embers.velocities[i3 + 1] = Math.random() * 0.3 + 0.1
          embers.velocities[i3 + 2] = windZ + (Math.random() - 0.5) * 0.2
        }
      }
      
      pointsRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <Points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={emberCount}
          array={embers.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={emberCount}
          array={embers.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <PointMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  )
}

// Quantum Field Visualization
function QuantumField({ showField }: { showField: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [time, setTime] = useState(0)
  
  useFrame((state, delta) => {
    setTime(prev => prev + delta)
    
    if (meshRef.current && showField) {
      meshRef.current.rotation.x = Math.sin(time * 0.5) * 0.1
      meshRef.current.rotation.y = time * 0.2
      
      // Type assertion for material
      const material = meshRef.current.material as THREE.MeshBasicMaterial
      if (material.opacity !== undefined) {
        material.opacity = 0.3 + Math.sin(time * 2) * 0.1
      }
    }
  })

  if (!showField) return null

  return (
    <mesh ref={meshRef} position={[0, 5, 0]}>
      <sphereGeometry args={[20, 32, 16]} />
      <meshBasicMaterial
        color="#8b5cf6"
        transparent
        opacity={0.3}
        wireframe
      />
    </mesh>
  )
}

// Terrain Component
function Terrain({ type }: { type: 'flat' | 'mountainous' | 'valley' }) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(100, 100, 32, 32)
    const positions = geo.attributes.position.array as Float32Array
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      
      switch (type) {
        case 'mountainous':
          positions[i + 1] = Math.sin(x * 0.1) * Math.cos(z * 0.1) * 10
          break
        case 'valley':
          positions[i + 1] = -(x * x + z * z) * 0.001
          break
        default:
          positions[i + 1] = 0
      }
    }
    
    geo.computeVertexNormals()
    return geo
  }, [type])

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -10, 0]}>
      <primitive object={geometry} />
      <meshLambertMaterial color="#2d4a2d" wireframe transparent opacity={0.3} />
    </mesh>
  )
}

// Main Scene Component
function Scene({ 
  fireData, 
  weatherData, 
  showEmberTrails, 
  showQuantumField, 
  terrain 
}: Omit<Fire3DVisualizationProps, 'className'>) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} color="#ff4500" />
      <pointLight position={[-10, 5, -10]} intensity={0.4} color="#ffaa00" />
      
      {/* Terrain */}
      <Terrain type={terrain || 'flat'} />
      
      {/* Fire Particles */}
      {fireData && (
        <FireParticles
          intensity={fireData.intensity}
          area={fireData.area}
          temperature={fireData.temperature}
        />
      )}
      
      {/* Ember Trails */}
      {showEmberTrails && fireData && weatherData && (
        <EmberParticles
          windSpeed={weatherData.windSpeed}
          windDirection={weatherData.windDirection}
          fireArea={fireData.area}
        />
      )}
      
      {/* Quantum Field */}
      <QuantumField showField={showQuantumField || false} />
      
      {/* Labels */}
      {fireData && (
        <Text
          position={[0, 15, 0]}
          fontSize={2}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Fire Intensity: {(fireData.intensity * 100).toFixed(1)}%
        </Text>
      )}
      
      {/* Wind Direction Indicator */}
      {weatherData && (
        <mesh
          position={[15, 10, 0]}
          rotation={[0, (weatherData.windDirection * Math.PI) / 180, 0]}
        >
          <coneGeometry args={[1, 3, 8]} />
          <meshBasicMaterial color="#00aaff" />
        </mesh>
      )}
      
      {/* Controls */}
      <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
    </>
  )
}

// --- MAIN COMPONENT ---
export function Fire3DVisualization({
  fireData,
  weatherData,
  showEmberTrails = false,
  showQuantumField = false,
  terrain = 'flat',
  className
}: Fire3DVisualizationProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  if (!isLoaded) {
    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-950 ${className}`}>
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p>Loading 3D Fire Simulation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [20, 15, 20], fov: 60 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Scene
          fireData={fireData}
          weatherData={weatherData}
          showEmberTrails={showEmberTrails}
          showQuantumField={showQuantumField}
          terrain={terrain}
        />
      </Canvas>
      
      {/* Overlay Controls */}
      <div className="absolute top-4 left-4 bg-black/90 rounded-lg p-3 text-white text-sm">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Flame className="w-4 h-4 text-red-500" />
          3D Fire Simulation
        </h3>
        
        <div className="space-y-1 text-xs">
          {fireData && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Fire Area:</span>
                <span>{fireData.area.toFixed(0)} hectares</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Intensity:</span>
                <span>{(fireData.intensity * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Temperature:</span>
                <span>{fireData.temperature}°C</span>
              </div>
            </>
          )}
          
          {weatherData && (
            <>
              <div className="flex justify-between">
                <span className="text-gray-400">Wind:</span>
                <span>{weatherData.windSpeed} mph {weatherData.windDirection}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Humidity:</span>
                <span>{weatherData.humidity}%</span>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-3 pt-2 border-t border-gray-700 text-xs text-gray-400">
          Mouse: Rotate • Scroll: Zoom • Drag: Pan
        </div>
      </div>
      
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-black/90 rounded-lg p-3 text-white text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Fire Particles</span>
          </div>
          
          {showEmberTrails && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>Ember Trails</span>
            </div>
          )}
          
          {showQuantumField && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span>Quantum Field</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>Wind Direction</span>
          </div>
        </div>
      </div>
      
      {/* Performance Stats */}
      <div className="absolute top-4 right-4 bg-black/90 rounded-lg p-2 text-white text-xs">
        <div className="text-green-400">● Real-time Physics</div>
      </div>
    </div>
  )
}

export default Fire3DVisualization
