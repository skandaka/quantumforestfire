'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Activity, 
  Zap, 
  TrendingUp, 
  Settings, 
  Menu, 
  X, 
  MapPin, 
  Radio,
  BarChart3,
  Atom,
  Brain,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout/Sidebar'
import { DataInput } from '@/components/forms/DataInput'
import { QuantumAnalytics } from '@/components/analytics/QuantumAnalytics'
import { ClassiqInterface } from '@/components/quantum/ClassiqInterface'
import { QuantumControls } from '@/components/quantum/QuantumControls'
import { Fire3DVisualization } from '@/components/visualization/Fire3DVisualization'
import { EnhancedFireMap } from '@/components/visualization/EnhancedFireMap'
import { RealTimeStream } from '@/components/streaming/RealTimeStream'
import { QuantumAnalyticsDashboard } from '@/components/quantum/QuantumAnalyticsDashboard'

export default function IntegratedDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity, color: 'blue' },
    { id: 'enhanced-map', label: 'Enhanced Map', icon: MapPin, color: 'green' },
    { id: 'real-time', label: 'Live Stream', icon: Radio, color: 'red' },
    { id: 'quantum', label: 'Quantum Core', icon: Zap, color: 'purple' },
    { id: 'quantum-analytics', label: 'Q-Analytics', icon: Atom, color: 'purple' },
    { id: 'ai-insights', label: 'AI Insights', icon: Brain, color: 'orange' },
    { id: 'global-view', label: 'Global View', icon: Globe, color: 'blue' },
    { id: 'settings', label: 'Settings', icon: Settings, color: 'gray' }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 rounded-xl border border-gray-800 p-8">
              <div className="text-center">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Quantum Fire Prediction Platform
                </h2>
                <p className="text-xl text-gray-300 mb-6">
                  Advanced quantum-enhanced wildfire prediction with real-time monitoring
                </p>
                <div className="flex justify-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">94.7%</div>
                    <div className="text-sm text-gray-400">Prediction Accuracy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-400">2.3x</div>
                    <div className="text-sm text-gray-400">Quantum Speedup</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-400">147</div>
                    <div className="text-sm text-gray-400">Active Monitors</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fire Visualization */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Activity className="w-6 h-6 text-red-400" />
                3D Fire Prediction Visualization
              </h3>
              <Fire3DVisualization className="h-96" />
            </div>

            {/* Data Input */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-6 h-6 text-blue-400" />
                Data Input & Configuration
              </h3>
              <DataInput />
            </div>
          </div>
        )

      case 'enhanced-map':
        return (
          <div className="space-y-6">
            <EnhancedFireMap />
          </div>
        )

      case 'real-time':
        return (
          <div className="space-y-6">
            <RealTimeStream />
          </div>
        )

      case 'quantum':
        return (
          <div className="space-y-6">
            {/* Quantum Controls */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-6 h-6 text-purple-400" />
                Quantum Processing Controls
              </h3>
              <QuantumControls />
            </div>

            {/* Classiq Interface */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Atom className="w-6 h-6 text-blue-400" />
                Classiq Quantum Platform
              </h3>
              <ClassiqInterface />
            </div>
          </div>
        )

      case 'quantum-analytics':
        return (
          <div className="space-y-6">
            <QuantumAnalyticsDashboard />
          </div>
        )

      case 'ai-insights':
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Brain className="w-6 h-6 text-orange-400" />
                AI-Powered Insights
              </h3>
              <QuantumAnalytics />
            </div>
          </div>
        )

      case 'global-view':
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                Global Fire Monitoring
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Global Stats */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-white mb-3">Worldwide Activity</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Active Fires</span>
                      <span className="text-red-400 font-bold">12,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">High Risk Zones</span>
                      <span className="text-orange-400 font-bold">2,103</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Countries Monitored</span>
                      <span className="text-green-400 font-bold">195</span>
                    </div>
                  </div>
                </div>

                {/* Regional Breakdown */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-white mb-3">Regional Hotspots</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">North America</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className="w-3/4 bg-red-500 h-2 rounded-full"></div>
                        </div>
                        <span className="text-red-400 text-sm">High</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Australia</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className="w-1/2 bg-orange-500 h-2 rounded-full"></div>
                        </div>
                        <span className="text-orange-400 text-sm">Med</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">South America</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div className="w-full bg-red-600 h-2 rounded-full"></div>
                        </div>
                        <span className="text-red-600 text-sm">Crit</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Climate Factors */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-white mb-3">Climate Factors</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Temperature</span>
                      <span className="text-red-400">+2.1°C above normal</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Drought Index</span>
                      <span className="text-orange-400">Severe</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Wind Conditions</span>
                      <span className="text-yellow-400">Elevated</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      case 'settings':
        return (
          <div className="space-y-6">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <Settings className="w-6 h-6 text-gray-400" />
                System Configuration
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Data Sources */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-medium text-white mb-4">Data Sources</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">NASA FIRMS</span>
                      </div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">NOAA Weather</span>
                      </div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-gray-300">USGS Terrain</span>
                      </div>
                      <span className="text-green-400 text-sm">Active</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span className="text-gray-300">OpenMeteo</span>
                      </div>
                      <span className="text-yellow-400 text-sm">Limited</span>
                    </div>
                  </div>
                </div>

                {/* Quantum Processing */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-medium text-white mb-4">Quantum Processing</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Quantum Advantage Mode</span>
                      <button className="px-3 py-1 bg-purple-600 text-white rounded text-sm">
                        Enabled
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Circuit Optimization</span>
                      <button className="px-3 py-1 bg-green-600 text-white rounded text-sm">
                        Active
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Error Correction</span>
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                        Enhanced
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Hardware Provider</span>
                      <select className="bg-gray-700 text-white border border-gray-600 rounded px-2 py-1 text-sm">
                        <option>Classiq</option>
                        <option>IBM Quantum</option>
                        <option>Rigetti</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Performance Monitoring */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-medium text-white mb-4">Performance</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Refresh Rate:</span>
                      <div className="text-white font-medium">30 seconds</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Cache Duration:</span>
                      <div className="text-white font-medium">5 minutes</div>
                    </div>
                    <div>
                      <span className="text-gray-400">API Timeout:</span>
                      <div className="text-white font-medium">30 seconds</div>
                    </div>
                    <div>
                      <span className="text-gray-400">Max Retries:</span>
                      <div className="text-white font-medium">3 attempts</div>
                    </div>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="text-lg font-medium text-white mb-4">Notifications</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">High Risk Alerts</span>
                      <input type="checkbox" checked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Quantum Processing</span>
                      <input type="checkbox" checked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Data Source Errors</span>
                      <input type="checkbox" checked className="rounded" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300">Weekly Reports</span>
                      <input type="checkbox" className="rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 bg-gray-800 rounded-lg border border-gray-700 shadow-lg"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Layout */}
      <div className="flex">
        {/* Sidebar */}
        <Sidebar className="hidden lg:block" />

        {/* Main Content */}
        <div className="flex-1 lg:ml-80">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent mb-2">
                Quantum Fire Prediction Platform
              </h1>
              <p className="text-gray-400 text-lg">
                Advanced quantum-enhanced wildfire prediction with real-time monitoring and analysis
              </p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6">
              <div className="border-b border-gray-800">
                <nav className="-mb-px flex space-x-1 overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "flex items-center gap-2 py-4 px-6 border-b-2 font-medium text-sm transition-all duration-200 whitespace-nowrap rounded-t-lg",
                          activeTab === tab.id
                            ? "border-purple-500 text-purple-400 bg-gray-900/50"
                            : "border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-700 hover:bg-gray-900/30"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
