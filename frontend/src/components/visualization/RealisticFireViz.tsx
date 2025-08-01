'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { FireParticles } from './FireParticles'

interface RealisticFireVizProps {
  fireData?: any
  intensity?: number
  windDirection?: number
  windSpeed?: number
  terrain?: any
}

export function RealisticFireViz({
  fireData,
  intensity = 0.8,
  windDirection = 45,
  windSpeed = 15,
  terrain
}: RealisticFireVizProps) {
  const groupRef = useRef<THREE.Group>(null!)

  // Create terrain mesh
  const terrainGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(50, 50, 32, 32)
    const vertices = geometry.attributes.position.array as Float32Array

    // Add some terrain variation
    for (let i = 2; i < vertices.length; i += 3) {
      vertices[i] = Math.random() * 2 - 1 // Random height variation
    }

    geometry.attributes.position.needsUpdate = true
    geometry.computeVertexNormals()
    
    return geometry
  }, [])

  // Fire zones based on fire data
  const fireZones = useMemo(() => {
    if (!fireData?.active_fires) {
      // Default fire for demonstration
      return [{
        position: [0, 0, 0],
        intensity: intensity,
        size: 5
      }]
    }

    return fireData.active_fires.map((fire: any, index: number) => ({
      position: [
        (index - fireData.active_fires.length / 2) * 10,
        0,
        0
      ],
      intensity: fire.intensity || 0.5,
      size: Math.sqrt(fire.area_hectares || 100) / 5
    }))
  }, [fireData, intensity])

  useFrame(() => {
    if (groupRef.current) {
      // Slight rotation for dynamic effect
      groupRef.current.rotation.y += 0.001
    }
  })

  return (
    <group ref={groupRef}>
      {/* Terrain */}
      <mesh 
        geometry={terrainGeometry} 
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1, 0]}
      >
        <meshLambertMaterial 
          color="#2a1810" 
          transparent 
          opacity={0.8}
        />
      </mesh>

      {/* Trees/Vegetation */}
      {Array.from({ length: 30 }, (_, i) => (
        <mesh
          key={i}
          position={[
            (Math.random() - 0.5) * 40,
            Math.random() * 2,
            (Math.random() - 0.5) * 40
          ]}
        >
          <cylinderGeometry args={[0.1, 0.2, 2]} />
          <meshLambertMaterial color="#1a4a1a" />
        </mesh>
      ))}

      {/* Fire zones */}
      {fireZones.map((zone: any, index: number) => (
        <group key={index} position={zone.position}>
          {/* Base fire glow */}
          <mesh>
            <sphereGeometry args={[zone.size * 0.5, 16, 8]} />
            <meshBasicMaterial
              color={new THREE.Color().setHSL(0.1, 1, 0.5)}
              transparent
              opacity={0.3}
            />
          </mesh>
          
          {/* Fire particles */}
          <FireParticles
            count={Math.floor(zone.intensity * 1000)}
            spread={zone.size}
            speed={1 + windSpeed / 20}
            intensity={zone.intensity}
          />

          {/* Fire core */}
          <mesh position={[0, 0.5, 0]}>
            <sphereGeometry args={[zone.size * 0.3, 8, 6]} />
            <meshBasicMaterial
              color={new THREE.Color().setHSL(0.1, 1, 0.8)}
              transparent
              opacity={0.6}
            />
          </mesh>
          
          {/* Wind-affected flame direction */}
          <group 
            rotation={[
              0, 
              (windDirection * Math.PI) / 180, 
              windSpeed > 20 ? 0.3 : 0
            ]}
          >
            <FireParticles
              count={Math.floor(zone.intensity * 500)}
              spread={zone.size * 1.5}
              speed={2 + windSpeed / 10}
              intensity={zone.intensity * 0.8}
            />
          </group>
        </group>
      ))}

      {/* Lighting */}
      <pointLight
        position={[0, 10, 0]}
        color="#ff4500"
        intensity={intensity * 2}
        distance={50}
      />
      
      <pointLight
        position={[10, 5, 10]}
        color="#ff6600"
        intensity={intensity}
        distance={30}
      />
    </group>
  )
}
