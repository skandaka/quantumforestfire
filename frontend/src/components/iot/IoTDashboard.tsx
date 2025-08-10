"use client";

import React, { useState, useEffect } from 'react';
import { ClientTime } from '@/components/ui/ClientTime';
interface DeviceRecord { device_id: string; device_name: string; device_type: string; status: string; battery_level?: number; sensors: string[]; last_seen: string; network_info?: { connection_type?: string; signal_strength?: number; ip_address?: string } }
interface AlertRecord { alert_id: string; alert_level: string; message: string; device_id: string; timestamp: string }
interface EdgeNode { node_id: string; status: string; processing_capacity: number; connected_devices: number }
interface SummaryRecord { active_devices?: number; total_devices?: number; recent_readings_count?: number; recent_alerts?: number }
import { motion } from 'framer-motion';

// IoT Dashboard Component
export default function IoTDashboard() {
  const [devices, setDevices] = useState<DeviceRecord[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [sensorData, setSensorData] = useState<any[]>([]);
  const [edgeNodes, setEdgeNodes] = useState<EdgeNode[]>([]);
  const [summary, setSummary] = useState<SummaryRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDevice, setSelectedDevice] = useState<DeviceRecord | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    loadIoTData();
    const interval = setInterval(loadIoTData, 30000); // Refresh every 30 seconds
    setMounted(true);
    return () => clearInterval(interval);
  }, []);

  const loadIoTData = async () => {
    try {
      setLoading(true);
      
      // Load IoT devices
      const devicesResponse = await fetch('/api/v1/phase4/iot/devices');
      const devicesData = await devicesResponse.json();
      setDevices(devicesData.devices || []);

      // Load alerts
      const alertsResponse = await fetch('/api/v1/phase4/iot/alerts?limit=20');
      const alertsData = await alertsResponse.json();
      setAlerts(alertsData.alerts || []);

      // Load sensor data
      const sensorResponse = await fetch('/api/v1/phase4/iot/sensor-data?limit=50');
      const sensorDataResponse = await sensorResponse.json();
      setSensorData(sensorDataResponse.readings || []);

      // Load edge nodes
      const edgeResponse = await fetch('/api/v1/phase4/iot/edge-nodes');
      const edgeData = await edgeResponse.json();
      setEdgeNodes(edgeData.edge_nodes || []);

      // Load summary
      const summaryResponse = await fetch('/api/v1/phase4/iot/summary');
      const summaryData = await summaryResponse.json();
      setSummary(summaryData.summary);

    } catch (error) {
      console.error('Error loading IoT data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100';
      case 'offline': return 'text-red-600 bg-red-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'low_battery': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getAlertLevelColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-red-800 bg-red-100 border-red-200';
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-800 bg-yellow-100 border-yellow-200';
      case 'info': return 'text-blue-800 bg-blue-100 border-blue-200';
      default: return 'text-gray-800 bg-gray-100 border-gray-200';
    }
  };

  const getSensorTypeIcon = (sensorType: string) => {
    const iconClass = "w-5 h-5";
    
    switch (sensorType) {
      case 'temperature':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'humidity':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
        );
      case 'smoke_detector':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'camera':
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading IoT dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">IoT Sensor Network</h1>
          <p className="mt-2 text-gray-600">
            Real-time monitoring and management of IoT devices and sensors
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-100 mr-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Devices</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.active_devices || 0} / {summary?.total_devices || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-100 mr-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Readings</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.recent_readings_count || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-100 mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Alerts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary?.recent_alerts || 0}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-sm border p-6"
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-100 mr-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Edge Nodes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {edgeNodes.filter(node => node.status === 'online').length} / {edgeNodes.length}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Device List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">IoT Devices</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {devices.map((device, index) => (
                  <motion.div
                    key={device.device_id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedDevice?.device_id === device.device_id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded-lg bg-gray-100">
                          {getSensorTypeIcon(device.device_type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{device.device_name}</h4>
                          <p className="text-sm text-gray-600">{device.device_id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(device.status)}`}>
                          {device.status}
                        </span>
                        {device.battery_level && (
                          <p className="text-sm text-gray-600 mt-1">
                            Battery: {device.battery_level.toFixed(0)}%
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {device.sensors.map((sensor: string) => (
                        <span key={sensor} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {sensor.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Last seen: <ClientTime value={device.last_seen} mode="datetime" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Alerts and Sensor Data */}
          <div className="space-y-6">
            {/* Recent Alerts */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {alerts.slice(0, 5).map((alert, index) => (
                  <motion.div
                    key={alert.alert_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg border ${getAlertLevelColor(alert.alert_level)}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{alert.message}</p>
                        <p className="text-xs mt-1 opacity-75">
                          Device: {alert.device_id} | <ClientTime value={alert.timestamp} />
                        </p>
                      </div>
                      <span className="ml-2 text-xs font-medium">
                        {alert.alert_level}
                      </span>
                    </div>
                  </motion.div>
                ))}
                {alerts.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No recent alerts</p>
                )}
              </div>
            </div>

            {/* Edge Nodes Status */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edge Computing Nodes</h3>
              <div className="space-y-3">
                {edgeNodes.map((node, index) => (
                  <motion.div
                    key={node.node_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{node.node_id}</p>
                        <p className="text-xs text-gray-600">
                          Capacity: {node.processing_capacity}%
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(node.status)}`}>
                          {node.status}
                        </span>
                        <p className="text-xs text-gray-600 mt-1">
                          Devices: {node.connected_devices}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Device Details Modal */}
        {selectedDevice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedDevice(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedDevice.device_name}
                </h3>
                <button
                  onClick={() => setSelectedDevice(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Device Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">ID:</span> {selectedDevice.device_id}</p>
                    <p><span className="text-gray-600">Type:</span> {selectedDevice.device_type}</p>
                    <p><span className="text-gray-600">Status:</span> 
                      <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDevice.status)}`}>
                        {selectedDevice.status}
                      </span>
                    </p>
                    <p><span className="text-gray-600">Battery:</span> {selectedDevice.battery_level?.toFixed(0)}%</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Network Information</h4>
                  <div className="space-y-2 text-sm">
                    <p><span className="text-gray-600">Connection:</span> {selectedDevice.network_info?.connection_type}</p>
                    <p><span className="text-gray-600">Signal:</span> {selectedDevice.network_info?.signal_strength} dBm</p>
                    <p><span className="text-gray-600">IP:</span> {selectedDevice.network_info?.ip_address}</p>
                    <p><span className="text-gray-600">Last seen:</span> <ClientTime value={selectedDevice.last_seen} mode="datetime" /></p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h4 className="font-medium text-gray-900 mb-2">Sensors</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDevice.sensors.map((sensor: string) => (
                    <span key={sensor} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      {sensor.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
