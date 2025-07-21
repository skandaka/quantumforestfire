'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface TerrainMeshProps {
  terrainData?: any
  size?: number
  segments?: number
}

export function TerrainMesh({
  terrainData,
  size = 100,
  segments = 50
}: TerrainMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null)

  // Generate terrain geometry
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(size, size, segments, segments)

    if (terrainData?.elevation_grid) {
      const positions = geo.attributes.position.array as Float32Array
      const elevationGrid = terrainData.elevation_grid

      // Apply elevation data to vertices
      for (let i = 0; i < positions.length; i += 3) {
        const x = Math.floor((i / 3) % (segments + 1))
        const y = Math.floor((i / 3) / (segments + 1))

        if (x < elevationGrid.length && y < elevationGrid[0]?.length) {
          positions[i + 2] = elevationGrid[x][y] * 0.01 // Scale elevation
        }
      }

      geo.computeVertexNormals()
    }

    return geo
  }, [terrainData, size, segments])

  // Terrain material with texture
  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: 0x3a2a1a,
      roughness: 0.8,
      metalness: 0.2,
      wireframe: false
    })
  }, [])

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    />
  )
}