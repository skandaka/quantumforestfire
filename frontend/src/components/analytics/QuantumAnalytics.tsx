'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Zap, 
  Target,
  Brain,
  Cpu,
  AlertTriangle,
  CheckCircle,
  Clock,
  Layers
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  accuracy: number
  precision: number
  recall: number
  f1_score: number
  processing_time: number
  confidence: number
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  quantum_advantage: number
}

interface QuantumAnalyticsProps {
  className?: string
}

export function QuantumAnalytics({ className }: QuantumAnalyticsProps) {
  const [data, setData] = useState<AnalyticsData>({
    accuracy: 0.94,
    precision: 0.91,
    recall: 0.88,
    f1_score: 0.89,
    processing_time: 1.2,
    confidence: 0.95,
    risk_level: 'medium',
    quantum_advantage: 2.3
  })
  const [isLoading, setIsLoading] = useState(false)

  const metrics = [
    {
      key: 'accuracy',
      label: 'Accuracy',
      value: data.accuracy,
      format: 'percentage',
      icon: Target,
      color: 'green',
      description: 'Overall prediction accuracy'
    },
    {
      key: 'precision',
      label: 'Precision',
      value: data.precision,
      format: 'percentage',
      icon: Zap,
      color: 'blue',
      description: 'Precision of fire predictions'
    },
    {
      key: 'recall',
      label: 'Recall',
      value: data.recall,
      format: 'percentage',
      icon: Activity,
      color: 'purple',
      description: 'Recall rate for fire detection'
    },
    {
      key: 'f1_score',
      label: 'F1 Score',
      value: data.f1_score,
      format: 'percentage',
      icon: BarChart3,
      color: 'orange',
      description: 'Harmonic mean of precision and recall'
    }
  ]

  const performanceMetrics = [
    {
      key: 'processing_time',
      label: 'Processing Time',
      value: data.processing_time,
      format: 'time',
      icon: Clock,
      color: 'gray',
      description: 'Average processing time per prediction'
    },
    {
      key: 'confidence',
      label: 'Confidence',
      value: data.confidence,
      format: 'percentage',
      icon: CheckCircle,
      color: 'green',
      description: 'Model confidence in predictions'
    },
    {
      key: 'quantum_advantage',
      label: 'Quantum Speedup',
      value: data.quantum_advantage,
      format: 'multiplier',
      icon: Cpu,
      color: 'purple',
      description: 'Quantum vs classical processing speedup'
    }
  ]

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage':
        return `${(value * 100).toFixed(1)}%`
      case 'time':
        return `${value.toFixed(1)}s`
      case 'multiplier':
        return `${value.toFixed(1)}x`
      default:
        return value.toFixed(3)
    }
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-orange-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'low': return CheckCircle
      case 'medium': return Activity
      case 'high': return AlertTriangle
      case 'critical': return AlertTriangle
      default: return Activity
    }
  }

  const refreshData = async () => {
    setIsLoading(true)
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Generate some realistic variations
    setData(prev => ({
      ...prev,
      accuracy: 0.90 + Math.random() * 0.08,
      precision: 0.85 + Math.random() * 0.1,
      recall: 0.82 + Math.random() * 0.12,
      f1_score: 0.85 + Math.random() * 0.1,
      processing_time: 0.8 + Math.random() * 1.0,
      confidence: 0.88 + Math.random() * 0.1,
      quantum_advantage: 2.0 + Math.random() * 1.0
    }))
    
    setIsLoading(false)
  }

  useEffect(() => {
    const interval = setInterval(refreshData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const RiskLevelIcon = getRiskLevelIcon(data.risk_level)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics Dashboard</h2>
          <p className="text-gray-400">Performance metrics and insights</p>
        </div>
        
        <button
          onClick={refreshData}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors disabled:opacity-50"
        >
          <BarChart3 className={cn("w-4 h-4", isLoading && "animate-pulse")} />
          Refresh
        </button>
      </div>

      {/* Risk Level Overview */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Risk Assessment</h3>
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            data.risk_level === 'low' && "bg-green-600",
            data.risk_level === 'medium' && "bg-yellow-600",
            data.risk_level === 'high' && "bg-orange-600",
            data.risk_level === 'critical' && "bg-red-600"
          )}>
            <RiskLevelIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className={cn("text-2xl font-bold capitalize", getRiskLevelColor(data.risk_level))}>
              {data.risk_level} Risk
            </p>
            <p className="text-gray-400">Based on current conditions and quantum analysis</p>
          </div>
        </div>
      </div>

      {/* Main Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">Model Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                <div className="flex items-center justify-between mb-2">
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    metric.color === 'green' && "bg-green-600",
                    metric.color === 'blue' && "bg-blue-600",
                    metric.color === 'purple' && "bg-purple-600",
                    metric.color === 'orange' && "bg-orange-600"
                  )}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs text-gray-400">{metric.format}</span>
                </div>
                
                <div className="mb-2">
                  <p className="text-2xl font-bold text-white">
                    {formatValue(metric.value, metric.format)}
                  </p>
                  <p className="text-sm text-gray-400">{metric.label}</p>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <motion.div
                    className={cn(
                      "h-2 rounded-full",
                      metric.color === 'green' && "bg-green-500",
                      metric.color === 'blue' && "bg-blue-500",
                      metric.color === 'purple' && "bg-purple-500",
                      metric.color === 'orange' && "bg-orange-500"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${metric.value * 100}%` }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                  />
                </div>
                
                <p className="text-xs text-gray-500 mt-2">{metric.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-4">System Performance</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {performanceMetrics.map((metric, index) => {
            const Icon = metric.icon
            return (
              <motion.div
                key={metric.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    metric.color === 'green' && "bg-green-600",
                    metric.color === 'gray' && "bg-gray-600",
                    metric.color === 'purple' && "bg-purple-600"
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">
                      {formatValue(metric.value, metric.format)}
                    </p>
                    <p className="text-sm text-gray-400">{metric.label}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500">{metric.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Quantum Advantage Visualization */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-400" />
          Quantum vs Classical Comparison
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Classical Processing</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-700 rounded-full h-3">
                <div className="w-full bg-blue-500 h-3 rounded-full"></div>
              </div>
              <span className="text-white font-medium">100%</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-300">Quantum Processing</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-700 rounded-full h-3">
                <motion.div
                  className="bg-purple-500 h-3 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.quantum_advantage / 3) * 100}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <span className="text-purple-400 font-medium">
                {formatValue(data.quantum_advantage, 'multiplier')} faster
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
