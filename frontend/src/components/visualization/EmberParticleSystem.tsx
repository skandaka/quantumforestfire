'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EmberParticleSystemProps {
  emberData?: any
  count?: number
  windField?: { speed: number; direction: number }
}

export function EmberParticleSystem({
  emberData,
  count = 5000,
  windField = { speed: 10, direction: 0 }
}: EmberParticleSystemProps) {
  const meshRef = useRef<THREE.Points>(null)
  const time = useRef(0)

  // Generate ember particles
  const [positions, velocities, lifetimes, sizes] = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const lifetimes = new Float32Array(count)
    const sizes = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3

      // Initial position (start from fire source)
      if (emberData?.fire_source) {
        positions[i3] = emberData.fire_source.x + (Math.random() - 0.5) * 10
        positions[i3 + 1] = Math.random() * 5 + 5 // Start elevated
        positions[i3 + 2] = emberData.fire_source.z + (Math.random() - 0.5) * 10
      } else {
        positions[i3] = (Math.random() - 0.5) * 20
        positions[i3 + 1] = Math.random() * 5 + 5
        positions[i3 + 2] = (Math.random() - 0.5) * 20
      }

      // Initial velocity with wind influence
      const windRad = (windField.direction * Math.PI) / 180
      velocities[i3] = Math.cos(windRad) * windField.speed * 0.1 + (Math.random() - 0.5) * 2
      velocities[i3 + 1] = Math.random() * 3 + 2 // Upward velocity
      velocities[i3 + 2] = Math.sin(windRad) * windField.speed * 0.1 + (Math.random() - 0.5) * 2

      // Lifetime (how long ember stays hot)
      lifetimes[i] = Math.random() * 30 + 20 // 20-50 seconds

      // Size variation
      sizes[i] = Math.random() * 0.3 + 0.1
    }

    return [positions, velocities, lifetimes, sizes]
  }, [count, emberData, windField])

  // Shader material for embers
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        pixelRatio: { value: window.devicePixelRatio }
      },
      vertexShader: `
        attribute float lifetime;
        attribute float size;
        varying float vLifetime;
        varying float vIntensity;
        uniform float time;
        
        void main() {
          vLifetime = lifetime;
          vIntensity = 1.0 - (mod(time, lifetime) / lifetime);
          
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * 300.0 * vIntensity / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vLifetime;
        varying float vIntensity;
        
        void main() {
          // Distance from center
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          
          // Soft particle edge
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          
          // Color based on intensity (hot to cool)
          vec3 hotColor = vec3(1.0, 1.0, 0.8);
          vec3 coolColor = vec3(1.0, 0.2, 0.0);
          vec3 color = mix(coolColor, hotColor, vIntensity);
          
          // Glow effect
          color += vec3(1.0, 0.5, 0.0) * (1.0 - dist) * 0.5;
          
          gl_FragColor = vec4(color, alpha * vIntensity);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true
    })
  }, [])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    time.current += delta
    material.uniforms.time.value = time.current

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array
    const lifetimes = meshRef.current.geometry.attributes.lifetime.array as Float32Array

    // Update particle positions
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const age = time.current % lifetimes[i]

      // Update position based on velocity and physics
      positions[i3] += velocities[i3] * delta
      positions[i3 + 1] += (velocities[i3 + 1] - age * 0.1) * delta // Gravity effect
      positions[i3 + 2] += velocities[i3 + 2] * delta

      // Add turbulence
      const turbulence = Math.sin(time.current + i) * 0.1
      positions[i3] += turbulence * delta
      positions[i3 + 2] += Math.cos(time.current + i) * 0.1 * delta

      // Reset particle if it's too old or hit ground
      if (age > lifetimes[i] * 0.9 || positions[i3 + 1] < 0) {
        // Respawn at source
        if (emberData?.fire_source) {
          positions[i3] = emberData.fire_source.x + (Math.random() - 0.5) * 10
          positions[i3 + 1] = Math.random() * 5 + 5
          positions[i3 + 2] = emberData.fire_source.z + (Math.random() - 0.5) * 10
        } else {
          positions[i3] = (Math.random() - 0.5) * 20
          positions[i3 + 1] = Math.random() * 5 + 5
          positions[i3 + 2] = (Math.random() - 0.5) * 20
        }

        // Reset velocity
        const windRad = (windField.direction * Math.PI) / 180
        velocities[i3] = Math.cos(windRad) * windField.speed * 0.1 + (Math.random() - 0.5) * 2
        velocities[i3 + 1] = Math.random() * 3 + 2
        velocities[i3 + 2] = Math.sin(windRad) * windField.speed * 0.1 + (Math.random() - 0.5) * 2
      }

      // Check for ember landing (Paradise Fire scenario)
      if (emberData?.landing_probability_map && positions[i3 + 1] < 1) {
        // Convert position to grid coordinates
        const gridX = Math.floor((positions[i3] + 50) / 100 * emberData.landing_probability_map.length)
        const gridZ = Math.floor((positions[i3 + 2] + 50) / 100 * emberData.landing_probability_map[0].length)

        if (gridX >= 0 && gridX < emberData.landing_probability_map.length &&
            gridZ >= 0 && gridZ < emberData.landing_probability_map[0].length) {
          const landingProb = emberData.landing_probability_map[gridX][gridZ]

          // Higher probability areas catch embers
          if (Math.random() < landingProb) {
            // Ember lands and potentially starts new fire
            positions[i3 + 1] = 0
            velocities[i3] = 0
            velocities[i3 + 1] = 0
            velocities[i3 + 2] = 0
          }
        }
      }
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true
  })

  return (
    <points ref={meshRef} material={material}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-velocity"
          count={count}
          array={velocities}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-lifetime"
          count={count}
          array={lifetimes}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-size"
          count={count}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
    </points>
  )
}