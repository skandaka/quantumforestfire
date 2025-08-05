'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Wifi, 
  WifiOff, 
  Battery, 
  Signal,
  Maximize2,
  Minimize2,
  RotateCcw,
  Settings,
  Activity,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
interface DeviceInfo {
  type: 'mobile' | 'tablet' | 'desktop'
  orientation: 'portrait' | 'landscape'
  screenSize: { width: number; height: number }
  isOnline: boolean
  batteryLevel?: number
  connectionType?: string
}

interface MobileOptimizedDashboardProps {
  className?: string
}

// --- HOOKS ---
function useDeviceInfo(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>({
    type: 'desktop',
    orientation: 'landscape',
    screenSize: { width: 1920, height: 1080 },
    isOnline: true
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      
      let type: DeviceInfo['type'] = 'desktop'
      if (width <= 768) type = 'mobile'
      else if (width <= 1024) type = 'tablet'
      
      const orientation = width > height ? 'landscape' : 'portrait'
      
      setDeviceInfo(prev => ({
        ...prev,
        type,
        orientation,
        screenSize: { width, height },
        isOnline: navigator.onLine
      }))
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)
    window.addEventListener('online', updateDeviceInfo)
    window.addEventListener('offline', updateDeviceInfo)

    // Battery API (if available)
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        setDeviceInfo(prev => ({
          ...prev,
          batteryLevel: battery.level * 100
        }))
      })
    }

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
      window.removeEventListener('online', updateDeviceInfo)
      window.removeEventListener('offline', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

// --- COMPONENTS ---

// Device Status Bar
function DeviceStatusBar({ deviceInfo }: { deviceInfo: DeviceInfo }) {
  const getDeviceIcon = () => {
    switch (deviceInfo.type) {
      case 'mobile': return Smartphone
      case 'tablet': return Tablet
      default: return Monitor
    }
  }

  const DeviceIcon = getDeviceIcon()

  return (
    <div className="bg-gray-900 border-b border-gray-800 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DeviceIcon className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-gray-300 capitalize">
            {deviceInfo.type} • {deviceInfo.orientation}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {deviceInfo.batteryLevel && (
            <div className="flex items-center gap-1">
              <Battery className="w-4 h-4 text-green-400" />
              <span className="text-xs text-gray-400">
                {Math.round(deviceInfo.batteryLevel)}%
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-1">
            {deviceInfo.isOnline ? (
              <Wifi className="w-4 h-4 text-green-400" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-400" />
            )}
            <Signal className="w-4 h-4 text-blue-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Navigation
function MobileNavigation({ activeTab, onTabChange, tabs }: {
  activeTab: string
  onTabChange: (tab: string) => void
  tabs: Array<{ id: string; label: string; icon: any }>
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
      <div className="grid grid-cols-4 gap-1 p-2">
        {tabs.slice(0, 4).map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
                activeTab === tab.id
                  ? "bg-purple-600 text-white"
                  : "text-gray-400 hover:text-gray-300 hover:bg-gray-800"
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// Mobile Fire Alert Card
function MobileFireAlertCard({ alert }: { alert: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn(
        "bg-gray-800 rounded-lg border p-4 mb-3",
        alert.severity === 'critical' ? 'border-red-500' :
        alert.severity === 'high' ? 'border-orange-500' :
        'border-yellow-500'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          alert.severity === 'critical' ? 'bg-red-600' :
          alert.severity === 'high' ? 'bg-orange-600' :
          'bg-yellow-600'
        )}>
          <AlertTriangle className="w-4 h-4 text-white" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium text-sm mb-1">
            {alert.title}
          </h3>
          <p className="text-gray-300 text-xs mb-2 line-clamp-2">
            {alert.description}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {alert.location}
            </span>
            <span className="text-xs text-gray-500">
              {alert.timestamp}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Mobile Metrics Grid
function MobileMetricsGrid({ metrics }: { metrics: any[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 mb-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon
        return (
          <motion.div
            key={metric.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-800 rounded-lg border border-gray-700 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={cn(
                "w-6 h-6 rounded flex items-center justify-center",
                `bg-${metric.color}-600`
              )}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs text-gray-400">{metric.label}</span>
            </div>
            
            <div className="text-lg font-bold text-white mb-1">
              {metric.value}
            </div>
            
            <div className="w-full bg-gray-700 rounded-full h-1">
              <div 
                className={cn("h-1 rounded-full", `bg-${metric.color}-500`)}
                style={{ width: `${metric.percentage}%` }}
              />
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Mobile Fire Map View
function MobileFireMapView() {
  const [selectedFire, setSelectedFire] = useState<number | null>(null)
  
  const fires = [
    { id: 1, name: "Paradise Fire", risk: "critical", distance: "2.3 km" },
    { id: 2, name: "Canyon Blaze", risk: "high", distance: "8.7 km" },
    { id: 3, name: "Ridge Fire", risk: "medium", distance: "15.2 km" }
  ]

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-white font-medium mb-3">Nearby Fire Activity</h3>
        
        {fires.map((fire) => (
          <div
            key={fire.id}
            onClick={() => setSelectedFire(selectedFire === fire.id ? null : fire.id)}
            className="flex items-center justify-between p-3 bg-gray-700 rounded-lg mb-2 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-3 h-3 rounded-full",
                fire.risk === 'critical' ? 'bg-red-500' :
                fire.risk === 'high' ? 'bg-orange-500' :
                'bg-yellow-500'
              )} />
              <div>
                <div className="text-white text-sm font-medium">{fire.name}</div>
                <div className="text-gray-400 text-xs">{fire.distance} away</div>
              </div>
            </div>
            
            <span className={cn(
              "text-xs px-2 py-1 rounded capitalize",
              fire.risk === 'critical' ? 'bg-red-600 text-white' :
              fire.risk === 'high' ? 'bg-orange-600 text-white' :
              'bg-yellow-600 text-black'
            )}>
              {fire.risk}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// --- MAIN COMPONENT ---
export function MobileOptimizedDashboard({ className }: MobileOptimizedDashboardProps) {
  const deviceInfo = useDeviceInfo()
  const [activeTab, setActiveTab] = useState('overview')
  const [isFullscreen, setIsFullscreen] = useState(false)

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { id: 'map', label: 'Map', icon: Monitor },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  const mockMetrics = [
    { key: 'fires', label: 'Active Fires', value: '12', percentage: 75, color: 'red', icon: Activity },
    { key: 'risk', label: 'Risk Level', value: 'High', percentage: 80, color: 'orange', icon: AlertTriangle },
    { key: 'accuracy', label: 'Accuracy', value: '94%', percentage: 94, color: 'green', icon: CheckCircle },
    { key: 'quantum', label: 'Q-Speedup', value: '2.3x', percentage: 85, color: 'purple', icon: Settings }
  ]

  const mockAlerts = [
    {
      id: 1,
      title: "Critical Fire Risk",
      description: "Extreme weather conditions detected in Paradise area",
      location: "Paradise, CA",
      severity: "critical",
      timestamp: "2 min ago"
    },
    {
      id: 2, 
      title: "High Wind Advisory",
      description: "Strong winds may escalate existing fire conditions",
      location: "Butte County",
      severity: "high",
      timestamp: "15 min ago"
    }
  ]

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <MobileMetricsGrid metrics={mockMetrics} />
            
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <h3 className="text-white font-medium mb-3">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-purple-600 text-white p-3 rounded-lg text-sm font-medium">
                  Run Prediction
                </button>
                <button className="bg-blue-600 text-white p-3 rounded-lg text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        )
      
      case 'alerts':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Fire Alerts</h2>
            {mockAlerts.map(alert => (
              <MobileFireAlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )
      
      case 'map':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Fire Map</h2>
            <MobileFireMapView />
          </div>
        )
      
      case 'settings':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">Settings</h2>
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Notifications</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Auto-refresh</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Dark Mode</span>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  if (deviceInfo.type === 'desktop') {
    return (
      <div className={cn("bg-gray-950 text-white p-6", className)}>
        <div className="text-center py-12">
          <Monitor className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Desktop View</h2>
          <p className="text-gray-400">
            This component is optimized for mobile devices. 
            Use the main dashboard for desktop experience.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("min-h-screen bg-gray-950 text-white", className)}>
      {/* Device Status Bar */}
      <DeviceStatusBar deviceInfo={deviceInfo} />
      
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white">Fire Prediction</h1>
            <p className="text-xs text-gray-400">Quantum-enhanced monitoring</p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 bg-gray-800 rounded-lg border border-gray-700"
            >
              {isFullscreen ? 
                <Minimize2 className="w-4 h-4" /> : 
                <Maximize2 className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 pb-24">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderTabContent()}
        </motion.div>
      </div>

      {/* Mobile Navigation */}
      <MobileNavigation 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />

      {/* Offline Banner */}
      <AnimatePresence>
        {!deviceInfo.isOnline && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-0 left-0 right-0 bg-red-600 text-white p-3 text-center z-50"
          >
            <div className="flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" />
              <span className="text-sm font-medium">Offline Mode</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
