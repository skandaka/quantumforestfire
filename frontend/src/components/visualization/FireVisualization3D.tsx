'use client'

import { Suspense, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Environment, Sky } from '@react-three/drei'
import { FireParticles } from './FireParticles'
import { AlertTriangle } from 'lucide-react'

interface FireVisualization3DProps {
  predictionData?: any
  showEmbers?: boolean
  showQuantumField?: boolean
  showTerrain?: boolean
  interactive?: boolean
}

function TerrainMesh({ fireData }: { fireData?: any }) {
  const terrainGeometry = useMemo(() => {
    const size = 50
    const segments = 32

    // Create a simple heightmap based on fire data
    const heights = new Float32Array(segments * segments)

    if (fireData?.active_fires) {
      fireData.active_fires.forEach((fire: any) => {
        const centerX = Math.floor(segments / 2)
        const centerY = Math.floor(segments / 2)
        const radius = 5

        for (let x = Math.max(0, centerX - radius); x < Math.min(segments, centerX + radius); x++) {
          for (let y = Math.max(0, centerY - radius); y < Math.min(segments, centerY + radius); y++) {
            const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2)
            if (distance < radius) {
              const height = (1 - distance / radius) * 2
              heights[x * segments + y] = height
            }
          }
        }
      })
    }

    return { size, segments, heights }
  }, [fireData])

  return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[terrainGeometry.size, terrainGeometry.size, terrainGeometry.segments, terrainGeometry.segments]} />
        <meshStandardMaterial
            color="#2d4a2d"
            roughness={0.9}
            metalness={0.1}
        />
      </mesh>
  )
}

function Scene({ predictionData, showTerrain }: { predictionData?: any; showTerrain?: boolean }) {
  return (
      <>
        {/* Lighting */}
        <ambientLight intensity={0.4} />
        <directionalLight
            position={[10, 10, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
        />

        {/* Environment */}
        <Sky
            distance={450000}
            sunPosition={[0, 1, 0]}
            inclination={0}
            azimuth={0.25}
        />

        {/* Terrain */}
        {showTerrain && <TerrainMesh fireData={predictionData} />}

        {/* Fire particles */}
        <FireParticles
            count={predictionData?.active_fires?.length ? predictionData.active_fires.length * 100 : 500}
            spread={15}
            speed={1.5}
        />

        {/* Fire locations as glowing spheres */}
        {predictionData?.active_fires?.map((fire: any, index: number) => (
            <mesh key={index} position={[
              (index % 3 - 1) * 10,
              2,
              Math.floor(index / 3) * 5 - 5
            ]} castShadow>
              <sphereGeometry args={[0.5 + (fire.intensity || 0.5), 16, 16]} />
              <meshStandardMaterial
                  color={fire.intensity > 0.8 ? '#ffffff' : fire.intensity > 0.5 ? '#ffff00' : '#ff4500'}
                  emissive={fire.intensity > 0.8 ? '#ffff00' : '#ff4500'}
                  emissiveIntensity={0.5}
              />
            </mesh>
        ))}
      </>
  )
}

export function FireVisualization3D({
                                      predictionData,
                                      showEmbers = true,
                                      showQuantumField = false,
                                      showTerrain = true,
                                      interactive = true,
                                    }: FireVisualization3DProps) {
  return (
      <div className="w-full h-full relative bg-black">
        <Suspense fallback={
          <div className="w-full h-full flex items-center justify-center text-white">
            <div className="text-center">
              <div className="spinner w-8 h-8 mx-auto mb-4"></div>
              <p>Loading 3D visualization...</p>
            </div>
          </div>
        }>
          <Canvas
              shadows
              camera={{ position: [15, 10, 15], fov: 60 }}
              gl={{ antialias: true, alpha: false }}
          >
            <Scene predictionData={predictionData} showTerrain={showTerrain} />

            {interactive && (
                <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={5}
                    maxDistance={50}
                    maxPolarAngle={Math.PI * 0.75}
                />
            )}
          </Canvas>
        </Suspense>

        {/* Info overlay */}
        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur rounded-lg p-4 text-white max-w-sm">
          <h3 className="font-bold mb-2">Fire Visualization</h3>
          {predictionData?.active_fires ? (
              <div className="space-y-1 text-sm">
                <p>Active Fires: {predictionData.active_fires.length}</p>
                <p>Particles: {predictionData.active_fires.length * 100}</p>
                {predictionData.metadata && (
                    <p>Model: {predictionData.metadata.model_type || 'Unknown'}</p>
                )}
              </div>
          ) : (
              <p className="text-sm text-gray-300">Loading fire data...</p>
          )}
        </div>

        {/* Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <div className="bg-black/70 backdrop-blur rounded-lg p-3 text-white text-sm">
            <p><strong>Controls:</strong></p>
            <p>• Mouse: Rotate view</p>
            <p>• Scroll: Zoom in/out</p>
            <p>• Drag: Pan camera</p>
          </div>
        </div>
      </div>
  )
}