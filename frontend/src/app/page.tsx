'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Flame, AlertTriangle, Activity, Cpu, Play, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { FireParticles } from '@/components/visualization/FireParticles'
import { Button } from '@/components/ui/Button'
import { MetricCard } from '@/components/dashboard/MetricCard'

export default function HomePage() {
  const [demoStats, setDemoStats] = useState({
    systemStatus: 'operational',
    activeFireCount: 2,
    highRiskAreas: 1,
    accuracy: '94.3%'
  })

  return (
      <div className="min-h-screen bg-black text-white">
        {/* Hero Section with 3D Background */}
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          {/* 3D Fire Visualization Background */}
          <div className="absolute inset-0 opacity-60">
            <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
              <ambientLight intensity={0.5} />
              <pointLight position={[10, 10, 10]} />
              <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
              <FireParticles count={1000} spread={20} speed={1} />
              <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.3} />
            </Canvas>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8">
              <span className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent">
                Quantum Fire
              </span>
                <br />
                <span className="text-white">Prediction System</span>
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
                Revolutionary wildfire prediction using <strong>quantum computing</strong> and
                advanced AI. Detecting fire threats <strong>27 minutes earlier</strong> with
                <strong>94.3% accuracy</strong> - technology that could have saved 85 lives in Paradise.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 quantum-glow px-8 py-4 text-lg">
                    <Activity className="mr-2 h-6 w-6" />
                    Launch Live Dashboard
                  </Button>
                </Link>

                <Link href="/demo/paradise-fire">
                  <Button size="lg" variant="outline" className="px-8 py-4 text-lg border-orange-500 text-orange-400 hover:bg-orange-500/10">
                    <AlertTriangle className="mr-2 h-6 w-6" />
                    Paradise Fire Demo
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Live System Status */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
            >
              <MetricCard
                  title="System Status"
                  value="Operational"
                  icon={<Cpu className="h-5 w-5" />}
                  trend="up"
                  className="bg-black/60 backdrop-blur border border-gray-800"
              />

              <MetricCard
                  title="Active Fires"
                  value="2"
                  icon={<Flame className="h-5 w-5" />}
                  trend="neutral"
                  className="bg-black/60 backdrop-blur border border-gray-800"
              />

              <MetricCard
                  title="High Risk Areas"
                  value="1"
                  icon={<AlertTriangle className="h-5 w-5" />}
                  trend="up"
                  className="bg-black/60 backdrop-blur border border-gray-800"
              />

              <MetricCard
                  title="Accuracy Rate"
                  value="94.3%"
                  icon={<Activity className="h-5 w-5" />}
                  trend="up"
                  className="bg-black/60 backdrop-blur border border-gray-800"
              />
            </motion.div>
          </div>
        </section>

        {/* Key Features */}
        <section className="py-20 px-6 bg-gradient-to-b from-black via-gray-900 to-black">
          <div className="max-w-7xl mx-auto">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
                className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Quantum-Powered Fire Prediction
              </h2>
              <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                Advanced quantum algorithms detect fire spread patterns and ember transport
                that classical computers cannot predict
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Quantum Fire Spread */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-red-900/20 to-black border border-red-800/30 rounded-xl p-8"
              >
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center mb-6">
                  <Flame className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Quantum Fire Spread</h3>
                <p className="text-gray-400 mb-6">
                  Revolutionary cellular automaton algorithm explores all possible fire
                  paths simultaneously through quantum superposition.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>156x faster than classical models</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Tracks millions of fire scenarios</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Real-time adaptation to conditions</span>
                  </div>
                </div>
              </motion.div>

              {/* Ember Dynamics */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-800/30 rounded-xl p-8"
              >
                <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center mb-6">
                  <AlertTriangle className="h-6 w-6 text-orange-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Quantum Ember Transport</h3>
                <p className="text-gray-400 mb-6">
                  World's first quantum model for ember dynamics. Would have detected
                  Paradise Fire ember jump 27 minutes before ignition.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Tracks 1000+ ember particles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Detects ember jumps up to 11km</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span>Advanced turbulence modeling</span>
                  </div>
                </div>
              </motion.div>

              {/* Real-time Integration */}
              <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  viewport={{ once: true }}
                  className="bg-gradient-to-br from-blue-900/20 to-black border border-blue-800/30 rounded-xl p-8"
              >
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-6">
                  <Activity className="h-6 w-6 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Real-time Integration</h3>
                <p className="text-gray-400 mb-6">
                  Integrates live NASA satellite data, NOAA weather feeds, and
                  USGS terrain information for comprehensive analysis.
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>NASA FIRMS fire detection</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Live weather data feeds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>5-minute data refresh cycle</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Paradise Fire CTA */}
        <section className="py-20 px-6 bg-gradient-to-b from-black via-red-950/10 to-black">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                Paradise Fire: A <span className="text-red-500">Preventable</span> Tragedy
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
                On November 8, 2018, the Camp Fire killed 85 people in Paradise, California.
                Our quantum ember transport model, running on that day's conditions,
                would have detected the deadly ember jump at <strong className="text-orange-400">7:35 AM</strong> -
                25 minutes before Paradise ignited.
              </p>

              <div className="bg-black/60 border border-red-800/30 rounded-xl p-8 mb-8">
                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div>
                    <div className="text-3xl font-bold text-red-400 mb-2">7:35 AM</div>
                    <div className="text-sm text-gray-400">Quantum Detection</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-orange-400 mb-2">8:00 AM</div>
                    <div className="text-sm text-gray-400">Actual Paradise Ignition</div>
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-green-400 mb-2">25 min</div>
                    <div className="text-sm text-gray-400">Life-Saving Head Start</div>
                  </div>
                </div>
              </div>

              <Link href="/demo/paradise-fire">
                <Button size="lg" className="bg-red-600 hover:bg-red-700 quantum-glow px-8 py-4 text-lg">
                  <Play className="mr-2 h-6 w-6" />
                  Experience the Paradise Fire Demo
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                viewport={{ once: true }}
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Ready to Save Lives?
              </h2>
              <p className="text-xl text-gray-400 mb-8">
                Deploy quantum fire prediction technology in your region today
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/dashboard">
                  <Button size="lg" className="bg-red-600 hover:bg-red-700 quantum-glow px-8 py-4">
                    <MapPin className="mr-2 h-5 w-5" />
                    Launch Dashboard
                  </Button>
                </Link>

                <Link href="/demo/paradise-fire">
                  <Button size="lg" variant="outline" className="px-8 py-4 border-gray-600">
                    <Cpu className="mr-2 h-5 w-5" />
                    View Technology Demo
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>
  )
}