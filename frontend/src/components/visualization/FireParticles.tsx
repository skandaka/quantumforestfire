'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface FireParticlesProps {
  count?: number
  spread?: number
  speed?: number
  intensity?: number
  fireData?: any
}

interface ParticleData {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  age: number
  maxAge: number
  size: number
  temperature: number
}

export function FireParticles({
  count = 2000,
  spread = 15,
  speed = 1,
  intensity = 0.8,
  fireData
}: FireParticlesProps) {
  const particles = useRef<THREE.Points>(null!)
  const smokeParticles = useRef<THREE.Points>(null!)
  const emberParticles = useRef<THREE.Points>(null!)
  
  const particleData = useRef<ParticleData[]>([])

  const [positions, colors, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    particleData.current = []

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Create particle data
      const particle: ParticleData = {
        x: (Math.random() - 0.5) * spread * 0.5,
        y: 0,
        z: (Math.random() - 0.5) * spread * 0.5,
        vx: (Math.random() - 0.5) * 0.2,
        vy: 0.5 + Math.random() * 0.5,
        vz: (Math.random() - 0.5) * 0.2,
        age: 0,
        maxAge: 20 + Math.random() * 30,
        size: 0.1 + Math.random() * 0.2,
        temperature: 1000 + Math.random() * 500
      }
      
      particleData.current.push(particle)
      
      // Set initial positions
      positions[i3] = particle.x
      positions[i3 + 1] = particle.y
      positions[i3 + 2] = particle.z
      
      // Fire color based on temperature
      const temp = particle.temperature
      if (temp > 1200) {
        colors[i3] = 1       // Red
        colors[i3 + 1] = 1   // Green
        colors[i3 + 2] = 0.8 // Blue (white-hot)
      } else if (temp > 900) {
        colors[i3] = 1       // Red
        colors[i3 + 1] = 0.8 // Green
        colors[i3 + 2] = 0   // Blue (yellow)
      } else {
        colors[i3] = 1       // Red
        colors[i3 + 1] = 0.3 // Green
        colors[i3 + 2] = 0   // Blue (orange/red)
      }
      
      sizes[i] = particle.size
    }

    return [positions, colors, sizes]
  }, [count, spread])

  // Smoke particles
  const [smokePositions, smokeColors, smokeSizes] = useMemo(() => {
    const smokeCount = Math.floor(count * 0.6)
    const positions = new Float32Array(smokeCount * 3)
    const colors = new Float32Array(smokeCount * 3)
    const sizes = new Float32Array(smokeCount)

    for (let i = 0; i < smokeCount; i++) {
      const i3 = i * 3
      
      positions[i3] = (Math.random() - 0.5) * spread
      positions[i3 + 1] = Math.random() * spread * 2
      positions[i3 + 2] = (Math.random() - 0.5) * spread
      
      // Smoke colors (gray to black)
      const opacity = 0.1 + Math.random() * 0.3
      colors[i3] = opacity
      colors[i3 + 1] = opacity
      colors[i3 + 2] = opacity
      
      sizes[i] = 0.3 + Math.random() * 0.7
    }

    return [positions, colors, sizes]
  }, [count, spread])

  // Ember particles
  const [emberPositions, emberColors, emberSizes] = useMemo(() => {
    const emberCount = Math.floor(count * 0.1)
    const positions = new Float32Array(emberCount * 3)
    const colors = new Float32Array(emberCount * 3)
    const sizes = new Float32Array(emberCount)

    for (let i = 0; i < emberCount; i++) {
      const i3 = i * 3
      
      positions[i3] = (Math.random() - 0.5) * spread * 2
      positions[i3 + 1] = Math.random() * spread
      positions[i3 + 2] = (Math.random() - 0.5) * spread * 2
      
      // Hot ember colors
      colors[i3] = 1
      colors[i3 + 1] = 0.1 + Math.random() * 0.4
      colors[i3 + 2] = 0
      
      sizes[i] = 0.05 + Math.random() * 0.1
    }

    return [positions, colors, sizes]
  }, [count, spread])

  useFrame((state) => {
    const time = state.clock.elapsedTime
    const dt = state.clock.getDelta()

    if (particles.current) {
      const positions = particles.current.geometry.attributes.position.array as Float32Array
      const colors = particles.current.geometry.attributes.color.array as Float32Array
      const sizes = particles.current.geometry.attributes.size.array as Float32Array

      for (let i = 0; i < particleData.current.length; i++) {
        const particle = particleData.current[i]
        const i3 = i * 3

        // Update particle physics
        particle.age += dt * speed
        
        // Apply wind and turbulence
        const windX = Math.sin(time * 0.5 + particle.x) * 0.1
        const windZ = Math.cos(time * 0.3 + particle.z) * 0.1
        
        particle.vx += windX * dt
        particle.vz += windZ * dt
        
        // Update position
        particle.x += particle.vx * dt
        particle.y += particle.vy * dt
        particle.z += particle.vz * dt
        
        // Update velocity (buoyancy and drag)
        particle.vy *= 0.98 // slight drag
        particle.vx *= 0.95
        particle.vz *= 0.95
        
        // Life cycle
        const ageRatio = particle.age / particle.maxAge
        
        if (particle.age > particle.maxAge) {
          // Reset particle
          particle.x = (Math.random() - 0.5) * spread * 0.5
          particle.y = 0
          particle.z = (Math.random() - 0.5) * spread * 0.5
          particle.vx = (Math.random() - 0.5) * 0.2
          particle.vy = 0.5 + Math.random() * 0.5
          particle.vz = (Math.random() - 0.5) * 0.2
          particle.age = 0
          particle.maxAge = 20 + Math.random() * 30
          particle.temperature = 1000 + Math.random() * 500
        }
        
        // Update positions
        positions[i3] = particle.x
        positions[i3 + 1] = particle.y
        positions[i3 + 2] = particle.z
        
        // Update colors based on age and temperature
        const alpha = Math.max(0, 1 - ageRatio)
        const temp = particle.temperature * alpha
        
        if (temp > 800) {
          colors[i3] = 1
          colors[i3 + 1] = 0.8 * alpha
          colors[i3 + 2] = 0.2 * alpha
        } else {
          colors[i3] = 1 * alpha
          colors[i3 + 1] = 0.3 * alpha
          colors[i3 + 2] = 0
        }
        
        // Update size (grows with age, then fades)
        sizes[i] = particle.size * alpha * (1 + ageRatio * 0.5)
      }

      particles.current.geometry.attributes.position.needsUpdate = true
      particles.current.geometry.attributes.color.needsUpdate = true
      particles.current.geometry.attributes.size.needsUpdate = true
    }

    // Animate smoke
    if (smokeParticles.current) {
      const positions = smokeParticles.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += speed * 0.01 // Rise slowly
        positions[i] += Math.sin(time + i) * 0.002 // Drift
        positions[i + 2] += Math.cos(time + i * 0.5) * 0.002
        
        if (positions[i + 1] > spread * 3) {
          positions[i + 1] = 0
          positions[i] = (Math.random() - 0.5) * spread
          positions[i + 2] = (Math.random() - 0.5) * spread
        }
      }
      smokeParticles.current.geometry.attributes.position.needsUpdate = true
    }

    // Animate embers
    if (emberParticles.current) {
      const positions = emberParticles.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += speed * 0.03 // Rise faster
        positions[i] += Math.sin(time * 2 + i) * 0.01 // More erratic movement
        positions[i + 2] += Math.cos(time * 1.5 + i) * 0.01
        
        if (positions[i + 1] > spread * 2) {
          positions[i + 1] = 0
          positions[i] = (Math.random() - 0.5) * spread
          positions[i + 2] = (Math.random() - 0.5) * spread
        }
      }
      emberParticles.current.geometry.attributes.position.needsUpdate = true
    }
  })

  return (
    <group>
      {/* Main fire particles */}
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
          <bufferAttribute
            attach="attributes-size"
            count={count}
            array={sizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.2}
          vertexColors
          blending={THREE.AdditiveBlending}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>

      {/* Smoke particles */}
      <points ref={smokeParticles}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={smokePositions.length / 3}
            array={smokePositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={smokePositions.length / 3}
            array={smokeColors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={smokeSizes.length}
            array={smokeSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.5}
          vertexColors
          blending={THREE.NormalBlending}
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>

      {/* Ember particles */}
      <points ref={emberParticles}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={emberPositions.length / 3}
            array={emberPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={emberPositions.length / 3}
            array={emberColors}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            count={emberSizes.length}
            array={emberSizes}
            itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.1}
          vertexColors
          blending={THREE.AdditiveBlending}
          transparent
          opacity={1.0}
          sizeAttenuation
        />
      </points>
    </group>
  )
}