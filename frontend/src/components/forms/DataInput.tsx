'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  MapPin, 
  Calendar, 
  Settings, 
  Play, 
  Pause,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Database
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface DataInputProps {
  className?: string
  onDataSubmit?: (data: any) => void
}

interface LocationData {
  latitude: number
  longitude: number
  address: string
}

interface TimeWindow {
  start: string
  end: string
  duration: number
}

export function DataInput({ className, onDataSubmit }: DataInputProps) {
  const [location, setLocation] = useState<LocationData>({
    latitude: 39.7392,
    longitude: -121.2078,
    address: 'Paradise, CA'
  })
  const [timeWindow, setTimeWindow] = useState<TimeWindow>({
    start: new Date().toISOString().slice(0, 16),
    end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    duration: 24
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const handleLocationChange = (field: keyof LocationData, value: string | number) => {
    setLocation(prev => ({ ...prev, [field]: value }))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setUploadedFiles(prev => [...prev, ...files])
  }

  const handleSubmit = async () => {
    setIsProcessing(true)
    
    // Simulate processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const data = {
      location,
      timeWindow,
      files: uploadedFiles,
      timestamp: new Date().toISOString()
    }
    
    onDataSubmit?.(data)
    setIsProcessing(false)
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Location Input */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-400" />
          Location Parameters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={location.latitude}
              onChange={(e) => handleLocationChange('latitude', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="0.000001"
              value={location.longitude}
              onChange={(e) => handleLocationChange('longitude', parseFloat(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Address/Description
            </label>
            <input
              type="text"
              value={location.address}
              onChange={(e) => handleLocationChange('address', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter location description..."
            />
          </div>
        </div>
      </div>

      {/* Time Window */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-green-400" />
          Time Window
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Time
            </label>
            <input
              type="datetime-local"
              value={timeWindow.start}
              onChange={(e) => setTimeWindow(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Time
            </label>
            <input
              type="datetime-local"
              value={timeWindow.end}
              onChange={(e) => setTimeWindow(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Duration (hours)
            </label>
            <input
              type="number"
              min="1"
              max="168"
              value={timeWindow.duration}
              onChange={(e) => setTimeWindow(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* File Upload */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database className="w-5 h-5 text-purple-400" />
          Additional Data Sources
        </h3>
        
        <div className="space-y-4">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 mb-2">Upload additional data files</p>
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              id="file-upload"
              accept=".csv,.json,.geojson,.kml"
            />
            <label
              htmlFor="file-upload"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
            >
              Choose Files
            </label>
            <p className="text-xs text-gray-500 mt-2">
              Supported: CSV, JSON, GeoJSON, KML
            </p>
          </div>
          
          {uploadedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-300">Uploaded Files:</h4>
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-700 rounded">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-gray-300">{file.name}</span>
                  <span className="text-xs text-gray-500 ml-auto">
                    {(file.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Process Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isProcessing}
          className={cn(
            "flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium transition-all duration-200",
            "hover:from-purple-700 hover:to-blue-700 focus:ring-4 focus:ring-purple-500/50",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Processing Data...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Process Data
            </>
          )}
        </button>
      </div>

      {/* Status */}
      {isProcessing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/50 border border-blue-600 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
            <div>
              <h4 className="font-medium text-blue-400">Processing Data</h4>
              <p className="text-blue-300 text-sm">
                Analyzing location parameters and preparing quantum processing pipeline...
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
