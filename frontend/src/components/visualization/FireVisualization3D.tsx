'use client'

import { Suspense, useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { OrbitControls, Environment, Sky, Text, Html, Sphere, Ring } from '@react-three/drei'
import { TextureLoader } from 'three/src/loaders/TextureLoader'
import * as THREE from 'three'
import { AlertTriangle, Flame, Wind, MapPin } from 'lucide-react'

interface FireVisualization3DProps {
    predictionData?: any
    showEmbers?: boolean
    showQuantumField?: boolean
    showTerrain?: boolean
    interactive?: boolean
}

// Enhanced Fire Particle System
function AdvancedFireParticles({ fire, intensity = 0.8 }: { fire: any; intensity?: number }) {
    const particlesRef = useRef<THREE.Points>(null)
    const count = Math.floor(intensity * 1000)

    const [positions, colors, sizes] = useMemo(() => {
        const positions = new Float32Array(count * 3)
        const colors = new Float32Array(count * 3)
        const sizes = new Float32Array(count)

        for (let i = 0; i < count; i++) {
            const i3 = i * 3
            // Create a more realistic fire plume shape
            const radius = Math.random() * 2
            const angle = Math.random() * Math.PI * 2
            const height = Math.random() * 8

            positions[i3] = Math.cos(angle) * radius
            positions[i3 + 1] = height
            positions[i3 + 2] = Math.sin(angle) * radius

            // Fire colors - from red at bottom to yellow/white at top
            const heightRatio = height / 8
            if (heightRatio < 0.3) {
                // Deep red at base
                colors[i3] = 0.8 + Math.random() * 0.2
                colors[i3 + 1] = 0.1 + Math.random() * 0.2
                colors[i3 + 2] = 0
            } else if (heightRatio < 0.6) {
                // Orange in middle
                colors[i3] = 1
                colors[i3 + 1] = 0.4 + Math.random() * 0.3
                colors[i3 + 2] = 0
            } else {
                // Yellow/white at top
                colors[i3] = 1
                colors[i3 + 1] = 0.8 + Math.random() * 0.2
                colors[i3 + 2] = 0.2 + Math.random() * 0.3
            }

            sizes[i] = 0.5 + Math.random() * 1.5
        }

        return [positions, colors, sizes]
    }, [count])

    useFrame((state) => {
        if (!particlesRef.current) return

        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
        const time = state.clock.elapsedTime

        for (let i = 0; i < count; i++) {
            const i3 = i * 3

            // Animate fire particles
            positions[i3 + 1] += 0.02 // Rise up
            positions[i3] += Math.sin(time + i) * 0.001 // Slight sway
            positions[i3 + 2] += Math.cos(time + i) * 0.001

            // Reset particles that rise too high
            if (positions[i3 + 1] > 12) {
                const radius = Math.random() * 2
                const angle = Math.random() * Math.PI * 2
                positions[i3] = Math.cos(angle) * radius
                positions[i3 + 1] = 0
                positions[i3 + 2] = Math.sin(angle) * radius
            }
        }

        particlesRef.current.geometry.attributes.position.needsUpdate = true
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
                size={0.2}
                vertexColors
                blending={THREE.AdditiveBlending}
                transparent
                opacity={0.8}
                sizeAttenuation
            />
        </points>
    )
}

// Enhanced Terrain with actual geography
function EnhancedTerrain({ fireData }: { fireData?: any }) {
    const meshRef = useRef<THREE.Mesh>(null)

    // Create realistic California terrain
    const geometry = useMemo(() => {
        const size = 50
        const segments = 64
        const geo = new THREE.PlaneGeometry(size, size, segments, segments)

        const positions = geo.attributes.position.array as Float32Array

        // Create realistic terrain based on California geography
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i]
            const y = positions[i + 1]

            // Create mountain ranges and valleys
            let height = 0

            // Sierra Nevada mountains (eastern edge)
            if (x > 15) {
                height += Math.sin((x - 15) * 0.3) * 8
            }

            // Coastal ranges (western edge)
            if (x < -10) {
                height += Math.cos((x + 10) * 0.4) * 4
            }

            // Central valley (depression)
            if (x > -10 && x < 15) {
                height -= 2
            }

            // Add some random variation
            height += (Math.sin(x * 0.1) * Math.cos(y * 0.1)) * 2
            height += Math.random() * 0.5

            positions[i + 2] = height
        }

        geo.computeVertexNormals()
        return geo
    }, [])

    const material = useMemo(() => {
        return new THREE.MeshLambertMaterial({
            color: 0x4a5d23,
            wireframe: false,
        })
    }, [])

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            material={material}
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -5, 0]}
            receiveShadow
            castShadow
        />
    )
}

// Fire location markers with realistic flames
function FireMarker({ fire, index }: { fire: any; index: number }) {
    const groupRef = useRef<THREE.Group>(null)
    const intensity = fire.intensity || 0.8
    const size = Math.max(0.5, (fire.area_hectares || 10) / 50)

    useFrame((state) => {
        if (groupRef.current) {
            // Slight animation for realism
            groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime + index) * 0.1
        }
    })

    return (
        <group
            ref={groupRef}
            position={[
                (index % 5 - 2) * 8 + Math.random() * 4,
                0,
                Math.floor(index / 5) * 8 - 10 + Math.random() * 4
            ]}
        >
            {/* Base fire glow */}
            <Sphere args={[size]} position={[0, 0.5, 0]}>
                <meshBasicMaterial
                    color={intensity > 0.8 ? '#ffffff' : intensity > 0.5 ? '#ffaa00' : '#ff4400'}
                    transparent
                    opacity={0.6}
                />
            </Sphere>

            {/* Fire ring effect */}
            <Ring args={[size * 0.8, size * 1.2, 16]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
                <meshBasicMaterial
                    color="#ff2200"
                    transparent
                    opacity={0.4}
                    side={THREE.DoubleSide}
                />
            </Ring>

            {/* Advanced fire particles */}
            <AdvancedFireParticles fire={fire} intensity={intensity} />

            {/* Information label */}
            <Html position={[0, 10, 0]} center>
                <div className="bg-black/80 backdrop-blur rounded-lg p-3 text-white min-w-[200px] border border-red-500/30">
                    <div className="flex items-center gap-2 mb-2">
                        <Flame className="w-4 h-4 text-red-500" />
                        <span className="font-bold text-red-400">Active Fire #{index + 1}</span>
                    </div>
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-400">Intensity:</span>
                            <span className={`font-medium ${
                                intensity > 0.8 ? 'text-red-400' :
                                    intensity > 0.5 ? 'text-orange-400' : 'text-yellow-400'
                            }`}>
                {(intensity * 100).toFixed(0)}%
              </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Area:</span>
                            <span className="text-white">{fire.area_hectares || 'Unknown'} ha</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-400">Confidence:</span>
                            <span className="text-green-400">{((fire.confidence || 0.8) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="pt-2 border-t border-gray-700 text-xs text-gray-400">
                            {fire.center_lat?.toFixed(4)}°, {fire.center_lon?.toFixed(4)}°
                        </div>
                    </div>
                </div>
            </Html>

            {/* Wind direction indicator */}
            <mesh position={[0, 5, 0]} rotation={[0, 0, Math.PI / 4]}>
                <coneGeometry args={[0.2, 1, 8]} />
                <meshBasicMaterial color="#00aaff" transparent opacity={0.7} />
            </mesh>
        </group>
    )
}

// Enhanced prediction visualization
function PredictionOverlay({ predictionData }: { predictionData?: any }) {
    if (!predictionData?.predictions?.[0]?.high_risk_cells) return null

    return (
        <group>
            {predictionData.predictions[0].high_risk_cells.slice(0, 20).map((cell: [number, number], index: number) => {
                const [x, z] = cell
                return (
                    <mesh
                        key={index}
                        position={[
                            (x - 25) * 0.8,
                            2,
                            (z - 25) * 0.8
                        ]}
                    >
                        <cylinderGeometry args={[0.3, 0.3, 4, 8]} />
                        <meshBasicMaterial
                            color="#ffff00"
                            transparent
                            opacity={0.6}
                            emissive="#ffaa00"
                            emissiveIntensity={0.2}
                        />
                    </mesh>
                )
            })}
        </group>
    )
}

// Main scene component
function Scene({ predictionData, showTerrain, showEmbers }: {
    predictionData?: any;
    showTerrain?: boolean;
    showEmbers?: boolean;
}) {
    return (
        <>
            {/* Enhanced lighting setup */}
            <ambientLight intensity={0.3} color="#404040" />
            <directionalLight
                position={[20, 20, 10]}
                intensity={1.2}
                color="#fff8dc"
                castShadow
                shadow-mapSize={[2048, 2048]}
                shadow-camera-far={100}
                shadow-camera-left={-50}
                shadow-camera-right={50}
                shadow-camera-top={50}
                shadow-camera-bottom={-50}
            />
            <pointLight position={[0, 10, 0]} intensity={0.5} color="#ff4400" />

            {/* Dynamic sky */}
            <Sky
                distance={450000}
                sunPosition={[1, 0.2, 0]}
                inclination={0.1}
                azimuth={0.25}
                turbidity={8}
                rayleigh={2}
            />

            {/* Enhanced terrain */}
            {showTerrain && <EnhancedTerrain fireData={predictionData} />}

            {/* Fire markers */}
            {predictionData?.active_fires?.map((fire: any, index: number) => (
                <FireMarker key={index} fire={fire} index={index} />
            ))}

            {/* Prediction overlay */}
            <PredictionOverlay predictionData={predictionData} />

            {/* Atmospheric fog effect */}
            <fog attach="fog" args={['#202020', 10, 80]} />
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
        <div className="w-full h-full relative bg-gradient-to-b from-gray-900 via-black to-gray-900">
            <Suspense fallback={
                <div className="w-full h-full flex items-center justify-center text-white">
                    <div className="text-center">
                        <div className="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-lg font-medium">Loading 3D Fire Visualization...</p>
                        <p className="text-sm text-gray-400 mt-2">Rendering realistic fire dynamics...</p>
                    </div>
                </div>
            }>
                <Canvas
                    shadows
                    camera={{ position: [25, 15, 25], fov: 60 }}
                    gl={{
                        antialias: true,
                        alpha: false,
                        shadowMap: true,
                        outputEncoding: THREE.sRGBEncoding,
                    }}
                >
                    <Scene
                        predictionData={predictionData}
                        showTerrain={showTerrain}
                        showEmbers={showEmbers}
                    />

                    {interactive && (
                        <OrbitControls
                            enablePan={true}
                            enableZoom={true}
                            enableRotate={true}
                            minDistance={8}
                            maxDistance={100}
                            maxPolarAngle={Math.PI * 0.8}
                            autoRotate={false}
                            autoRotateSpeed={0.2}
                        />
                    )}
                </Canvas>
            </Suspense>

            {/* Enhanced info overlay */}
            <div className="absolute top-4 left-4 space-y-4">
                <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4 text-white max-w-sm border border-red-500/30">
                    <div className="flex items-center gap-2 mb-3">
                        <Flame className="w-5 h-5 text-red-500" />
                        <h3 className="font-bold text-lg">Fire Status</h3>
                    </div>
                    {predictionData?.active_fires ? (
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-400">Active Fires:</span>
                                <span className="text-red-400 font-bold">{predictionData.active_fires.length}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Total Area:</span>
                                <span className="text-orange-400">
                  {predictionData.active_fires.reduce((sum: number, fire: any) =>
                      sum + (fire.area_hectares || 0), 0
                  ).toLocaleString()} ha
                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-400">Avg Intensity:</span>
                                <span className="text-yellow-400">
                  {(predictionData.active_fires.reduce((sum: number, fire: any) =>
                          sum + (fire.intensity || 0), 0) / predictionData.active_fires.length * 100
                  ).toFixed(0)}%
                </span>
                            </div>
                            {predictionData.metadata && (
                                <div className="pt-2 border-t border-gray-700">
                                    <div className="flex justify-between">
                                        <span className="text-gray-400">Model:</span>
                                        <span className="text-purple-400">{predictionData.metadata.model_type || 'Quantum'}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-300">Loading fire data...</p>
                    )}
                </div>

                {/* Legend */}
                <div className="bg-black/70 backdrop-blur-lg rounded-xl p-4 text-white border border-orange-500/30">
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Legend
                    </h4>
                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                            <span>High Intensity Fire</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span>Medium Intensity</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                            <span>Risk Zone</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span>Wind Direction</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced controls */}
            <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-lg rounded-xl p-4 text-white border border-blue-500/30">
                <h4 className="font-bold mb-3">Controls</h4>
                <div className="space-y-1 text-sm">
                    <p><strong>Mouse:</strong> Rotate view</p>
                    <p><strong>Scroll:</strong> Zoom in/out</p>
                    <p><strong>Drag:</strong> Pan camera</p>
                    <p><strong>Click:</strong> Fire details</p>
                </div>
            </div>

            {/* Performance indicator */}
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-lg rounded-lg px-3 py-2 text-xs text-gray-400">
                3D Quantum Fire Visualization • Enhanced Mode
            </div>
        </div>
    )
}