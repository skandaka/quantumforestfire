'use client';

import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useFirePredictionStore } from '@/lib/store';
import { TerrainMesh } from './TerrainRenderer';
import { EmberParticleSystem } from './EmberParticleSystem';
import { QuantumFieldVisualization } from './QuantumFieldVisualization';

interface FireVisualization3DProps {
  predictionData?: any;
  showEmbers?: boolean;
  showQuantumField?: boolean;
  showTerrain?: boolean;
  interactive?: boolean;
}

// Fire particle system
function FireParticleSystem({ fireData }: { fireData: any }) {
  const meshRef = useRef<THREE.Points>(null);
  const particleCount = 10000;

  const [positions, colors, sizes, velocities] = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Position particles based on fire data or random
      if (fireData?.fire_probability_map) {
        // Use actual fire probability map
        const gridSize = fireData.fire_probability_map.length;
        const x = Math.floor(Math.random() * gridSize);
        const y = Math.floor(Math.random() * gridSize);
        const probability = fireData.fire_probability_map[x]?.[y] || 0;

        if (Math.random() < probability) {
          positions[i3] = (x / gridSize - 0.5) * 100;
          positions[i3 + 1] = Math.random() * 5;
          positions[i3 + 2] = (y / gridSize - 0.5) * 100;
        } else {
          positions[i3] = (Math.random() - 0.5) * 100;
          positions[i3 + 1] = Math.random() * 5;
          positions[i3 + 2] = (Math.random() - 0.5) * 100;
        }
      } else {
        // Random distribution
        positions[i3] = (Math.random() - 0.5) * 100;
        positions[i3 + 1] = Math.random() * 5;
        positions[i3 + 2] = (Math.random() - 0.5) * 100;
      }

      // Fire colors (red to orange to yellow)
      const heat = Math.random();
      if (heat > 0.8) {
        // White hot core
        colors[i3] = 1;
        colors[i3 + 1] = 1;
        colors[i3 + 2] = 0.8;
      } else if (heat > 0.5) {
        // Yellow
        colors[i3] = 1;
        colors[i3 + 1] = 0.8;
        colors[i3 + 2] = 0.2;
      } else if (heat > 0.2) {
        // Orange
        colors[i3] = 1;
        colors[i3 + 1] = 0.4;
        colors[i3 + 2] = 0.1;
      } else {
        // Red
        colors[i3] = 1;
        colors[i3 + 1] = 0.1;
        colors[i3 + 2] = 0.1;
      }

      // Size variation
      sizes[i] = Math.random() * 2 + 0.5;

      // Upward velocity with some randomness
      velocities[i3] = (Math.random() - 0.5) * 0.2;
      velocities[i3 + 1] = Math.random() * 0.5 + 0.5;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.2;
    }

    return [positions, colors, sizes, velocities];
  }, [fireData]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    const positions = meshRef.current.geometry.attributes.position.array as Float32Array;
    const colors = meshRef.current.geometry.attributes.color.array as Float32Array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Update position
      positions[i3] += velocities[i3] * delta * 10;
      positions[i3 + 1] += velocities[i3 + 1] * delta * 10;
      positions[i3 + 2] += velocities[i3 + 2] * delta * 10;

      // Add turbulence
      positions[i3] += Math.sin(state.clock.elapsedTime + i) * 0.1;
      positions[i3 + 2] += Math.cos(state.clock.elapsedTime + i) * 0.1;

      // Reset particles that go too high
      if (positions[i3 + 1] > 20) {
        positions[i3 + 1] = 0;

        // Respawn based on fire data
        if (fireData?.fire_probability_map) {
          const gridSize = fireData.fire_probability_map.length;
          const x = Math.floor(Math.random() * gridSize);
          const y = Math.floor(Math.random() * gridSize);
          const probability = fireData.fire_probability_map[x]?.[y] || 0;

          if (Math.random() < probability) {
            positions[i3] = (x / gridSize - 0.5) * 100;
            positions[i3 + 2] = (y / gridSize - 0.5) * 100;
          }
        }
      }

      // Update color based on height (cooling as it rises)
      const height = positions[i3 + 1] / 20;
      colors[i3] = 1;
      colors[i3 + 1] = 1 - height * 0.8;
      colors[i3 + 2] = 1 - height;
    }

    meshRef.current.geometry.attributes.position.needsUpdate = true;
    meshRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
      <points ref={meshRef}>
        <bufferGeometry>
          <bufferAttribute
              attach="attributes-position"
              count={particleCount}
              array={positions}
              itemSize={3}
          />
          <bufferAttribute
              attach="attributes-color"
              count={particleCount}
              array={colors}
              itemSize={3}
          />
          <bufferAttribute
              attach="attributes-size"
              count={particleCount}
              array={sizes}
              itemSize={1}
          />
        </bufferGeometry>
        <pointsMaterial
            size={1}
            sizeAttenuation
            vertexColors
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
        />
      </points>
  );
}

// Wind field visualization
function WindFieldVisualization({ windData }: { windData: any }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const arrowCount = 400; // 20x20 grid

  useEffect(() => {
    if (!meshRef.current || !windData) return;

    const gridSize = 20;
    const spacing = 5;
    const tempObject = new THREE.Object3D();

    let index = 0;
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const posX = (x - gridSize / 2) * spacing;
        const posZ = (z - gridSize / 2) * spacing;

        // Get wind data for this position
        const windSpeed = windData.wind_speed || 10;
        const windDirection = windData.wind_direction || 0;

        // Position
        tempObject.position.set(posX, 2, posZ);

        // Rotation based on wind direction
        tempObject.rotation.y = (windDirection * Math.PI) / 180;

        // Scale based on wind speed
        const scale = windSpeed / 20;
        tempObject.scale.set(scale, scale, scale * 2);

        tempObject.updateMatrix();
        meshRef.current.setMatrixAt(index, tempObject.matrix);

        // Color based on wind speed
        const color = new THREE.Color();
        color.setHSL(0.6 - (windSpeed / 50) * 0.6, 1, 0.5);
        if (meshRef.current.instanceColor) {
          meshRef.current.setColorAt(index, color);
        }

        index++;
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [windData]);

  return (
      <instancedMesh ref={meshRef} args={[undefined, undefined, arrowCount]}>
        <coneGeometry args={[0.5, 2, 4]} />
        <meshStandardMaterial />
      </instancedMesh>
  );
}

// Main visualization component
export function FireVisualization3D({
                                      predictionData,
                                      showEmbers = true,
                                      showQuantumField = true,
                                      showTerrain = true,
                                      interactive = true,
                                    }: FireVisualization3DProps) {
  const { currentPrediction, windData } = useFirePredictionStore();
  const data = predictionData || currentPrediction;

  return (
      <div className="w-full h-full relative">
        <Canvas shadows camera={{ position: [50, 30, 50], fov: 60 }}>
          <PerspectiveCamera makeDefault position={[50, 30, 50]} />

          {/* Lighting */}
          <ambientLight intensity={0.2} />
          <directionalLight
              position={[50, 50, 25]}
              intensity={1}
              castShadow
              shadow-mapSize-width={2048}
              shadow-mapSize-height={2048}
          />
          <pointLight position={[0, 20, 0]} intensity={2} color="#ff6b6b" />

          {/* Environment */}
          <Environment preset="night" />
          <fog attach="fog" args={['#1a1a1a', 50, 200]} />

          {/* Terrain */}
          {showTerrain && <TerrainMesh terrainData={data?.terrain} />}

          {/* Fire particles */}
          <FireParticleSystem fireData={data} />

          {/* Ember system */}
          {showEmbers && data?.ember_analysis && (
              <EmberParticleSystem emberData={data.ember_analysis} />
          )}

          {/* Quantum field visualization */}
          {showQuantumField && (
              <QuantumFieldVisualization quantumData={data?.quantum_metrics} />
          )}

          {/* Wind field */}
          {windData && <WindFieldVisualization windData={windData} />}

          {/* Controls */}
          {interactive && (
              <OrbitControls
                  enablePan={true}
                  enableZoom={true}
                  enableRotate={true}
                  maxPolarAngle={Math.PI * 0.45}
                  minDistance={20}
                  maxDistance={150}
              />
          )}

          {/* Post-processing effects */}
          <EffectComposer>
            <Bloom
                intensity={1.5}
                luminanceThreshold={0.2}
                luminanceSmoothing={0.9}
                radius={0.8}
            />
            <ChromaticAberration
                offset={new THREE.Vector2(0.002, 0.002)}
                radialModulation={false}
                modulationOffset={0}
            />
          </EffectComposer>
        </Canvas>

        {/* Overlay controls */}
        <div className="absolute top-4 right-4 glass rounded-lg p-4 space-y-2">
          <div className="text-sm font-semibold mb-2">Visualization Controls</div>
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={showTerrain} className="rounded" />
            <span>Terrain</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={showEmbers} className="rounded" />
            <span>Embers</span>
          </label>
          <label className="flex items-center space-x-2 text-sm">
            <input type="checkbox" checked={showQuantumField} className="rounded" />
            <span>Quantum Field</span>
          </label>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 glass rounded-lg p-4">
          <div className="text-sm font-semibold mb-2">Fire Intensity</div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-yellow-400 rounded" />
              <span className="text-xs">Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-orange-500 rounded" />
              <span className="text-xs">Medium</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-600 rounded" />
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-white rounded" />
              <span className="text-xs">Extreme</span>
            </div>
          </div>
        </div>
      </div>
  );
}