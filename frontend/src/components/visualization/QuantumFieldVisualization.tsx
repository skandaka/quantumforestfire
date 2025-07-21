'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface QuantumFieldVisualizationProps {
  quantumData?: any
  size?: number
  resolution?: number
}

export function QuantumFieldVisualization({
  quantumData,
  size = 100,
  resolution = 50
}: QuantumFieldVisualizationProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  // Create quantum field shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        quantumIntensity: { value: 0.5 },
        fieldData: {
          value: quantumData?.field || new Float32Array(resolution * resolution)
        },
        resolution: { value: new THREE.Vector2(resolution, resolution) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vPosition;
        uniform float time;
        uniform sampler2D fieldData;
        
        void main() {
          vUv = uv;
          vPosition = position;
          
          // Add quantum fluctuations to vertex positions
          vec3 pos = position;
          float quantum = texture2D(fieldData, uv).r;
          pos.y += sin(position.x * 0.1 + time) * quantum * 2.0;
          pos.y += cos(position.z * 0.1 + time) * quantum * 2.0;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float quantumIntensity;
        uniform vec2 resolution;
        uniform sampler2D fieldData;
        varying vec2 vUv;
        varying vec3 vPosition;
        
        // Quantum interference pattern
        vec3 quantumInterference(vec2 uv, float t) {
          float phase1 = sin(uv.x * 10.0 + t) * cos(uv.y * 10.0 + t);
          float phase2 = sin(uv.x * 15.0 - t * 0.7) * cos(uv.y * 15.0 - t * 0.7);
          float interference = (phase1 + phase2) * 0.5;
          
          // Quantum colors (purple to cyan)
          vec3 color1 = vec3(0.6, 0.1, 0.9);
          vec3 color2 = vec3(0.1, 0.8, 0.9);
          
          return mix(color1, color2, interference * 0.5 + 0.5);
        }
        
        void main() {
          // Sample quantum field data
          float fieldValue = texture2D(fieldData, vUv).r;
          
          // Create quantum interference pattern
          vec3 quantum = quantumInterference(vUv, time);
          
          // Add field intensity
          quantum *= fieldValue * quantumIntensity;
          
          // Add glow effect
          float glow = 1.0 - length(vUv - 0.5) * 2.0;
          glow = max(0.0, glow);
          quantum += vec3(0.5, 0.3, 0.8) * glow * 0.3;
          
          // Pulsing effect
          float pulse = sin(time * 2.0) * 0.1 + 0.9;
          quantum *= pulse;
          
          gl_FragColor = vec4(quantum, fieldValue * 0.5);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [quantumData, resolution])

  // Create field texture from quantum data
  useMemo(() => {
    if (quantumData?.field && materialRef.current) {
      const texture = new THREE.DataTexture(
        new Float32Array(quantumData.field),
        resolution,
        resolution,
        THREE.RedFormat,
        THREE.FloatType
      )
      texture.needsUpdate = true
      materialRef.current.uniforms.fieldData.value = texture
    }
  }, [quantumData, resolution])

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime

      // Update quantum intensity based on data
      if (quantumData?.metrics) {
        const intensity = quantumData.metrics.quantum_advantage || 0.5
        materialRef.current.uniforms.quantumIntensity.value = intensity
      }
    }

    // Gentle rotation for visual effect
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.elapsedTime * 0.05
    }
  })

  return (
    <group>
      {/* Quantum field plane */}
      <mesh
        ref={meshRef}
        material={material}
        position={[0, 5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[size, size, resolution, resolution]} />
        <primitive object={material} ref={materialRef} />
      </mesh>

      {/* Quantum state indicators */}
      {quantumData?.quantum_states && (
        <group>
          {quantumData.quantum_states.map((state: any, index: number) => (
            <mesh
              key={index}
              position={[state.x * size - size/2, 10, state.z * size - size/2]}
            >
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshBasicMaterial
                color={state.collapsed ? '#ff6b6b' : '#6b6bff'}
                opacity={0.8}
                transparent
              />
            </mesh>
          ))}
        </group>
      )}

      {/* Quantum circuit visualization (simplified) */}
      {quantumData?.circuit_depth && (
        <group position={[0, 20, 0]}>
          {Array.from({ length: Math.min(quantumData.circuit_depth, 10) }).map((_, i) => (
            <mesh
              key={i}
              position={[i * 2 - quantumData.circuit_depth, 0, 0]}
            >
              <boxGeometry args={[1.5, 0.1, 3]} />
              <meshBasicMaterial
                color="#00ff00"
                opacity={0.3}
                transparent
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  )
}