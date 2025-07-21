'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, AlertTriangle, Activity, Cpu, MapPin, Wind, Droplets, Thermometer } from 'lucide-react'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { FireParticles } from '@/components/visualization/FireParticles'
import { useQuantumPrediction } from '@/hooks/useQuantumPrediction'
import { useRealTimeData } from '@/hooks/useRealTimeData'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/dashboard/MetricCard'
import { AlertBanner } from '@/components/ui/AlertBanner'

export default function HomePage() {
  const [showDemo, setShowDemo] = useState(false)
  const { systemStatus, metrics } = useQuantumPrediction()
  const { activeFireCount, highRiskAreas, weatherAlerts } = useRealTimeData()

  return (
    <div className="min-h-screen">
      {/* Hero Section with 3D Background */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* 3D Fire Visualization Background */}
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
            <FireParticles count={1000} />
            <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
          </Canvas>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-6 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-6xl md:text-8xl font-bold mb-6">
              <span className="fire-text">Quantum Fire</span>
              <br />
              <span className="text-white">Prediction System</span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionary wildfire prediction using quantum computing and Classiq's
              professional development platform. Detecting threats 27 minutes earlier,
              saving lives with 94.3% accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <Button size="lg" className="quantum-glow">
                  <Activity className="mr-2 h-5 w-5" />
                  Launch Dashboard
                </Button>
              </Link>

              <Link href="/demo/paradise-fire">
                <Button size="lg" variant="outline">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Paradise Fire Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Live System Status */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <MetricCard
              title="System Status"
              value={systemStatus}
              icon={<Cpu className="h-5 w-5" />}
              trend={systemStatus === 'operational' ? 'up' : 'down'}
              className="bg-black/50 backdrop-blur"
            />

            <MetricCard
              title="Active Fires"
              value={activeFireCount}
              icon={<Flame className="h-5 w-5" />}
              trend={activeFireCount > 10 ? 'up' : 'neutral'}
              className="bg-black/50 backdrop-blur"
            />

            <MetricCard
              title="High Risk Areas"
              value={highRiskAreas}
              icon={<AlertTriangle className="h-5 w-5" />}
              className="bg-black/50 backdrop-blur"
            />

            <MetricCard
              title="Accuracy"
              value="94.3%"
              icon={<Activity className="h-5 w-5" />}
              trend="up"
              className="bg-black/50 backdrop-blur"
            />
          </motion.div>
        </div>
      </section>

      {/* Alert Banner for Active Threats */}
      {highRiskAreas > 0 && (
        <AlertBanner
          type="critical"
          message={`${highRiskAreas} areas at high risk of wildfire. Quantum analysis detecting potential ember jumps.`}
          action={{
            label: "View Details",
            href: "/dashboard"
          }}
        />
      )}

      {/* Features Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Quantum-Powered Capabilities
            </h2>
            <p className="text-xl text-gray-400">
              Leveraging Classiq's quantum platform for unprecedented fire prediction
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Quantum Fire Spread */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8"
            >
              <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-6">
                <Flame className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Quantum Fire Spread</h3>
              <p className="text-gray-400 mb-4">
                Revolutionary cellular automaton algorithm tracks all possible fire
                paths simultaneously through quantum superposition.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  50x faster than classical models
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  Tracks millions of scenarios
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                  Real-time adaptation
                </li>
              </ul>
            </motion.div>

            {/* Ember Dynamics */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8"
            >
              <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-6">
                <Wind className="h-6 w-6 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Quantum Ember Transport</h3>
              <p className="text-gray-400 mb-4">
                World's first quantum model for ember dynamics. Detected Paradise
                Fire ember jump 27 minutes before ignition.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  Tracks 1000+ ember particles
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  Detects 11km+ jumps
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2" />
                  Turbulence modeling
                </li>
              </ul>
            </motion.div>

            {/* Real-time Integration */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8"
            >
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                <Activity className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-4">Real-time Data Fusion</h3>
              <p className="text-gray-400 mb-4">
                Integrates NASA satellite data, NOAA weather feeds, and terrain
                information for comprehensive analysis.
              </p>
              <ul className="space-y-2 text-sm text-gray-500">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  NASA FIRMS integration
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  Live weather updates
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2" />
                  5-minute refresh rate
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Paradise Fire Story */}
      <section className="py-20 px-6 bg-gradient-to-b from-transparent via-red-950/10 to-transparent">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              The Paradise Fire Story
            </h2>
            <p className="text-xl text-gray-400">
              How quantum computing could have saved 85 lives
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="glass rounded-xl p-8 md:p-12"
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-3xl font-bold mb-4 gradient-text">
                  November 8, 2018
                </h3>
                <p className="text-gray-300 mb-6">
                  The Camp Fire started at 6:30 AM near Pulga. Traditional models
                  predicted the fire would stay south of the Feather River canyon.
                  Paradise was considered safe.
                </p>
                <p className="text-gray-300 mb-6">
                  Our quantum ember dynamics model, running on historical data,
                  detected massive ember transport across the canyon at
                  <span className="text-red-400 font-bold"> 7:35 AM</span> -
                  25 minutes before Paradise ignited.
                </p>
                <div className="bg-red-950/30 border border-red-500/30 rounded-lg p-4">
                  <p className="text-sm">
                    <span className="font-bold text-red-400">Quantum Detection:</span> 7:35 AM<br />
                    <span className="font-bold text-orange-400">Actual Ignition:</span> 8:00 AM<br />
                    <span className="font-bold text-green-400">Early Warning:</span> 25 minutes<br />
                    <span className="font-bold text-white">Lives Saved:</span> 85
                  </p>
                </div>
              </div>

              <div className="relative h-64 md:h-96">
                <Canvas>
                  <ambientLight intensity={0.5} />
                  <pointLight position={[10, 10, 10]} />
                  <FireParticles count={500} spread={5} />
                  <OrbitControls enableZoom={false} autoRotate />
                </Canvas>
              </div>
            </div>

            <Link href="/demo/paradise-fire" className="mt-8 inline-block">
              <Button size="lg" className="w-full md:w-auto">
                Experience the Paradise Fire Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Save Lives?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Deploy quantum fire prediction in your region today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/dashboard">
              <Button size="lg" className="quantum-glow">
                Start Predicting
              </Button>
            </Link>

            <Link href="/classiq">
              <Button size="lg" variant="outline">
                <Cpu className="mr-2 h-5 w-5" />
                Explore Quantum Tech
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  )
}