'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, MapPin, Activity, Clock } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'

// Dynamic imports to avoid SSR issues
const ParadiseFireDemo = dynamic(
  () => import('@/components/demo/ParadiseFireDemo').then(mod => ({ default: mod.ParadiseFireDemo })),
  { ssr: false }
)

const MapView = dynamic(
  () => import('@/components/dashboard/MapView'),
  { ssr: false }
)

const FireVisualization3D = dynamic(
  () => import('@/components/visualization/FireVisualization3D').then(mod => ({ default: mod.FireVisualization3D })),
  { ssr: false }
)

export default function ParadiseFireDemoPage() {
  const [activeView, setActiveView] = useState<'demo' | 'map' | '3d'>('demo')

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="text-center p-8">
        <h1 className="text-3xl font-bold text-orange-400 mb-4">
          Paradise Fire Demo
        </h1>
        <ParadiseFireDemo />
      </div>
    </div>
  )
}
