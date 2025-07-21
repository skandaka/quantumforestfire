'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FireParticlesProps {
  count?: number
  spread?: number
  speed?: number
}

export function FireParticles({
  count = 1000,
  spread = 10,
  speed = 1
}: FireParticlesProps) {
  const particles = useRef<THREE.Points>(null!)

  const [positions, colors] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      // Random position within spread
      positions[i3] = (Math.random() - 0.5) * spread
      positions[i3 + 1] = Math.random() * spread * 0.5
      positions[i3 + 2] = (Math.random() - 0.5) * spread

      // Fire colors from red to yellow
      const intensity = Math.random()
      colors[i3] = 1
      colors[i3 + 1] = intensity * 0.5
      colors[i3 + 2] = 0
    }

    return [positions, colors]
  }, [count, spread])

  useFrame((state) => {
    if (!particles.current) return

    const positions = particles.current.geometry.attributes.position.array as Float32Array
    const time = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Move particles upward
      positions[i3 + 1] += speed * 0.02

      // Add some waviness
      positions[i3] += Math.sin(time + i) * 0.001
      positions[i3 + 2] += Math.cos(time + i) * 0.001

      // Reset position when too high
      if (positions[i3 + 1] > spread) {
        positions[i3 + 1] = 0
        positions[i3] = (Math.random() - 0.5) * spread
        positions[i3 + 2] = (Math.random() - 0.5) * spread
      }
    }

    particles.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={particles}>
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
        blending={THREE.AdditiveBlending}
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  )
}