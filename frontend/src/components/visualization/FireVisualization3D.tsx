'use client'

import React, { useRef, useMemo, useState, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { 
  OrbitControls, 
  Environment, 
  Sky, 
  Clouds, 
  Html
} from '@react-three/drei'
import * as THREE from 'three'

interface FireVisualization3DProps {
  predictionData?: any
  showEmbers?: boolean
  showQuantumField?: boolean
  showTerrain?: boolean
  interactive?: boolean
}

// Fire particles component
function FireParticles({ count = 1000, position = [0, 0, 0], intensity = 1 }: {
  count: number
  position: [number, number, number]
  intensity: number
}) {
  const particlesRef = useRef<THREE.Points>(null!)
  
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Position particles in a fire-like shape
      const radius = Math.random() * 2 * intensity
      const angle = Math.random() * Math.PI * 2
      const height = Math.random() * 5 * intensity
      
      positions[i3] = Math.cos(angle) * radius * (1 - height * 0.1) + position[0]
      positions[i3 + 1] = height + position[1]
      positions[i3 + 2] = Math.sin(angle) * radius * (1 - height * 0.1) + position[2]
      
      // Color based on height (temperature)
      const temp = height / (5 * intensity)
      if (temp > 0.8) {
        colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 0.8 // White hot
      } else if (temp > 0.5) {
        colors[i3] = 1; colors[i3 + 1] = 0.8; colors[i3 + 2] = 0.2 // Yellow
      } else {
        colors[i3] = 1; colors[i3 + 1] = 0.3; colors[i3 + 2] = 0 // Orange-red
      }
      
      sizes[i] = 0.1 + Math.random() * 0.4
    }
    
    return { positions, colors, sizes }
  }, [count, position, intensity])

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const colors = particlesRef.current.geometry.attributes.color.array as Float32Array
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        
        // Animate flames
        positions[i3] += Math.sin(state.clock.elapsedTime * 2 + i * 0.1) * 0.01
        positions[i3 + 1] += 0.02 * intensity
        positions[i3 + 2] += Math.cos(state.clock.elapsedTime * 1.5 + i * 0.1) * 0.01
        
        // Reset particles that go too high
        if (positions[i3 + 1] > 15) {
          const radius = Math.random() * 2 * intensity
          const angle = Math.random() * Math.PI * 2
          positions[i3] = Math.cos(angle) * radius + position[0]
          positions[i3 + 1] = position[1]
          positions[i3 + 2] = Math.sin(angle) * radius + position[2]
        }
        
        // Update colors based on height
        const height = positions[i3 + 1] - position[1]
        const temp = height / (5 * intensity)
        const alpha = Math.max(0, 1 - temp)
        
        colors[i3] = alpha
        colors[i3 + 1] = alpha * 0.6
        colors[i3 + 2] = alpha * 0.2
      }
      
      particlesRef.current.geometry.attributes.position.needsUpdate = true
      particlesRef.current.geometry.attributes.color.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

// Smoke particles
function SmokeParticles({ count, position, windDirection, windSpeed }: {
  count: number
  position: [number, number, number]
  windDirection: number
  windSpeed: number
}) {
  const smokeRef = useRef<THREE.Points>(null!)
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      positions[i3] = position[0] + (Math.random() - 0.5) * 4
      positions[i3 + 1] = position[1] + Math.random() * 5
      positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 4
      
      const opacity = 0.1 + Math.random() * 0.2
      colors[i3] = opacity * 0.3
      colors[i3 + 1] = opacity * 0.3
      colors[i3 + 2] = opacity * 0.3
    }
    
    return { positions, colors }
  }, [count, position])

  useFrame((state, delta) => {
    if (smokeRef.current) {
      const positions = smokeRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        
        // Move smoke up and with wind
        positions[i3] += Math.sin(windDirection) * windSpeed * delta * 0.1
        positions[i3 + 1] += delta * 2
        positions[i3 + 2] += Math.cos(windDirection) * windSpeed * delta * 0.1
        
        // Add turbulence
        positions[i3] += Math.sin(state.clock.elapsedTime + i) * 0.01
        positions[i3 + 2] += Math.cos(state.clock.elapsedTime + i) * 0.01
        
        // Reset if too high
        if (positions[i3 + 1] > position[1] + 20) {
          positions[i3] = position[0] + (Math.random() - 0.5) * 4
          positions[i3 + 1] = position[1]
          positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 4
        }
      }
      
      smokeRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={smokeRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.8}
        vertexColors
        transparent
        opacity={0.6}
      />
    </points>
  )
}

// Ember particles
function EmberParticles({ count, position, windDirection, windSpeed }: {
  count: number
  position: [number, number, number]
  windDirection: number
  windSpeed: number
}) {
  const emberRef = useRef<THREE.Points>(null!)
  
  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      positions[i3] = position[0] + (Math.random() - 0.5) * 6
      positions[i3 + 1] = position[1] + Math.random() * 3
      positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 6
      
      colors[i3] = 1
      colors[i3 + 1] = 0.3 + Math.random() * 0.5
      colors[i3 + 2] = 0
    }
    
    return { positions, colors }
  }, [count, position])

  useFrame((state, delta) => {
    if (emberRef.current) {
      const positions = emberRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < count; i++) {
        const i3 = i * 3
        
        // Embers affected by wind and gravity
        positions[i3] += Math.sin(windDirection) * windSpeed * delta * 0.2
        positions[i3 + 1] += delta * 0.5 - delta * 0.1 // Up then down
        positions[i3 + 2] += Math.cos(windDirection) * windSpeed * delta * 0.2
        
        // Reset if too far
        if (positions[i3 + 1] < position[1] - 5 || 
            Math.abs(positions[i3] - position[0]) > 30 ||
            Math.abs(positions[i3 + 2] - position[2]) > 30) {
          positions[i3] = position[0] + (Math.random() - 0.5) * 6
          positions[i3 + 1] = position[1] + Math.random() * 3
          positions[i3 + 2] = position[2] + (Math.random() - 0.5) * 6
        }
      }
      
      emberRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={emberRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// Advanced fire system with multiple particle types
function AdvancedFireSystem({ position, intensity = 1, windDirection = 0, windSpeed = 5 }: {
  position: [number, number, number]
  intensity: number
  windDirection: number
  windSpeed: number
}) {
  return (
    <group position={position}>
      {/* Main fire */}
      <FireParticles 
        count={Math.floor(intensity * 1500)}
        position={[0, 0, 0]}
        intensity={intensity}
      />
      
      {/* Smoke particles */}
      <SmokeParticles 
        count={Math.floor(intensity * 500)}
        position={[0, 3, 0]}
        windDirection={windDirection}
        windSpeed={windSpeed}
      />
      
      {/* Embers */}
      <EmberParticles 
        count={Math.floor(intensity * 200)}
        position={[0, 1, 0]}
        windDirection={windDirection}
        windSpeed={windSpeed}
      />
      
      {/* Fire glow */}
      <mesh position={[0, 1, 0]}>
        <sphereGeometry args={[intensity * 0.8, 8, 6]} />
        <meshBasicMaterial
          color={intensity > 0.7 ? "#ffffff" : "#ff4500"}
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* Point light */}
      <pointLight
        position={[0, 2, 0]}
        color="#ff4500"
        intensity={intensity * 3}
        distance={25}
        decay={2}
      />
    </group>
  )
}

// Complex terrain system
function ComplexTerrain({ fireData }: { fireData?: any }) {
  const terrainRef = useRef<THREE.Mesh>(null!)

  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(100, 100, 64, 64)
    const vertices = geometry.attributes.position.array as Float32Array

    // Generate terrain height
    for (let i = 2; i < vertices.length; i += 3) {
      const x = vertices[i - 2]
      const z = vertices[i - 1]
      
      let height = 0
      height += Math.sin(x * 0.1) * Math.cos(z * 0.1) * 2
      height += Math.sin(x * 0.05) * Math.cos(z * 0.05) * 4
      height += (Math.random() - 0.5) * 0.5
      
      vertices[i] = height
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
    
    return geometry
  }, [])

  return (
    <mesh 
      ref={terrainRef}
      geometry={terrainGeometry} 
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -5, 0]}
      receiveShadow
    >
      <meshLambertMaterial 
        color="#2d5016"
        wireframe={false}
      />
    </mesh>
  )
}

// Quantum field visualization
function QuantumField({ predictionData }: { predictionData?: any }) {
  const fieldRef = useRef<THREE.Group>(null!)

  useFrame((state) => {
    if (fieldRef.current) {
      fieldRef.current.rotation.y += 0.01
      
      fieldRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          child.material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.2
        }
      })
    }
  })

  if (!predictionData?.predictions?.[0]?.high_risk_cells) {
    return null
  }

  return (
    <group ref={fieldRef}>
      {predictionData.predictions[0].high_risk_cells.map((cell: [number, number], index: number) => (
        <mesh key={index} position={[(cell[0] - 25) * 2, 5, (cell[1] - 25) * 2]}>
          <sphereGeometry args={[0.5, 8, 6]} />
          <meshBasicMaterial 
            color="#00ffff" 
            transparent 
            opacity={0.3}
            wireframe
          />
        </mesh>
      ))}
    </group>
  )
}

// Wind field visualization
function WindField({ windDirection, windSpeed }: { windDirection: number; windSpeed: number }) {
  const windRef = useRef<THREE.Points>(null!)
  
  const windParticles = useMemo(() => {
    const count = 300
    const positions = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 80
      positions[i3 + 1] = Math.random() * 15 + 5
      positions[i3 + 2] = (Math.random() - 0.5) * 80
    }
    
    return positions
  }, [])

  useFrame((state, delta) => {
    if (windRef.current) {
      const positions = windRef.current.geometry.attributes.position.array as Float32Array
      
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(windDirection) * windSpeed * delta * 0.05
        positions[i + 2] += Math.cos(windDirection) * windSpeed * delta * 0.05
        
        if (Math.abs(positions[i]) > 40 || Math.abs(positions[i + 2]) > 40) {
          positions[i] = (Math.random() - 0.5) * 20
          positions[i + 2] = (Math.random() - 0.5) * 20
        }
      }
      windRef.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <points ref={windRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={windParticles.length / 3}
          array={windParticles}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#87CEEB"
        transparent
        opacity={0.3}
      />
    </points>
  )
}

export function FireVisualization3D({
  predictionData,
  showEmbers = true,
  showQuantumField = false,
  showTerrain = true,
  interactive = true
}: FireVisualization3DProps) {
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([20, 15, 20])
  const [timeOfDay, setTimeOfDay] = useState(0.7)

  const fires = useMemo(() => {
    if (predictionData?.active_fires) {
      return predictionData.active_fires.map((fire: any, index: number) => ({
        id: fire.id || index,
        position: [
          (index - predictionData.active_fires.length / 2) * 15,
          0,
          0
        ] as [number, number, number],
        intensity: fire.intensity || 0.8,
        windDirection: Math.PI / 4,
        windSpeed: 10
      }))
    }
    return [{
      id: 'demo',
      position: [0, 0, 0] as [number, number, number],
      intensity: 0.8,
      windDirection: Math.PI / 4,
      windSpeed: 10
    }]
  }, [predictionData])

  return (
    <div className="w-full h-full bg-black">
      <Canvas
        camera={{ position: cameraPosition, fov: 60 }}
        shadows
        gl={{ antialias: true, alpha: false }}
      >
        {/* Environment */}
        <Sky 
          distance={450000}
          sunPosition={[100, timeOfDay * 100, 100]}
          inclination={0}
          azimuth={0.25}
        />
        
        <Environment preset="night" />
        
        <Clouds
          material={THREE.MeshLambertMaterial}
          limit={100}
          range={100}
        />

        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={timeOfDay}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />

        {/* Terrain */}
        {showTerrain && <ComplexTerrain fireData={predictionData} />}

        {/* Fire systems */}
        {fires.map((fire: any) => (
          <AdvancedFireSystem
            key={fire.id}
            position={fire.position}
            intensity={fire.intensity}
            windDirection={fire.windDirection}
            windSpeed={fire.windSpeed}
          />
        ))}

        {/* Quantum field */}
        {showQuantumField && <QuantumField predictionData={predictionData} />}

        {/* Wind field */}
        <WindField windDirection={Math.PI / 4} windSpeed={10} />

        {/* Controls */}
        {interactive && (
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={100}
            minPolarAngle={0}
            maxPolarAngle={Math.PI / 2}
          />
        )}

        {/* Information overlay */}
        <Html position={[-40, 20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="bg-black/80 text-white p-4 rounded-lg text-sm">
            <h3 className="font-bold mb-2">3D Fire Simulation</h3>
            <div>Active Fires: {fires.length}</div>
            <div>Particles: {fires.reduce((sum: number, fire: any) => sum + fire.intensity * 2200, 0)}</div>
            <div>Wind: 10 mph NE</div>
            <div>Time: {Math.floor(timeOfDay * 24)}:00</div>
          </div>
        </Html>
      </Canvas>

      {/* Controls overlay */}
      <div className="absolute top-4 right-4 bg-black/80 text-white p-4 rounded-lg">
        <h4 className="font-semibold mb-2">Visualization Controls</h4>
        <div className="space-y-2">
          <label className="block text-sm">
            Time of Day:
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(parseFloat(e.target.value))}
              className="ml-2 w-20"
            />
          </label>
          <div className="text-xs space-y-1">
            <div>🖱️ Click + drag to rotate</div>
            <div>🖱️ Scroll to zoom</div>
            <div>🖱️ Right-click + drag to pan</div>
          </div>
        </div>
      </div>

      {/* Error Boundary */}
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <div className="text-center text-white">
            <div className="animate-spin w-8 h-8 mx-auto mb-4 border-2 border-white border-t-transparent rounded-full"></div>
            <p>Loading 3D Fire Simulation...</p>
          </div>
        </div>
      }>
        {/* Canvas content loads here */}
      </Suspense>
    </div>
  )
}
