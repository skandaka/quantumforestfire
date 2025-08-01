import { AlertTriangle, Flame, Wind, Users } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  type: 'fire' | 'weather' | 'evacuation' | 'high_risk'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  message: string
  location?: {
    latitude: number
    longitude: number
    name?: string
  }
  timestamp: string
  probability?: number
}

interface AlertPanelProps {
  alerts: Alert[]
}

export function AlertPanel({ alerts }: AlertPanelProps) {
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fire':
        return <Flame className="h-5 w-5" />
      case 'weather':
        return <Wind className="h-5 w-5" />
      case 'evacuation':
        return <Users className="h-5 w-5" />
      case 'high_risk':
        return <AlertTriangle className="h-5 w-5" />
      default:
        return <AlertTriangle className="h-5 w-5" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-500/10'
      case 'high':
        return 'border-orange-500 bg-orange-500/10'
      case 'medium':
        return 'border-yellow-500 bg-yellow-500/10'
      case 'low':
        return 'border-blue-500 bg-blue-500/10'
      default:
        return 'border-gray-500 bg-gray-500/10'
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
          <p className="text-gray-500">No active alerts</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold mb-4">Active Alerts</h2>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={cn(
              'rounded-lg border-l-4 p-4 glass',
              getSeverityColor(alert.severity)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="text-gray-400">
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{alert.title}</h3>
                    <p className="text-sm text-gray-300 mt-1">{alert.message}</p>

                    {alert.location && (
                      <p className="text-xs text-gray-400 mt-2">
                        Location: {alert.location.latitude.toFixed(4)}°, {alert.location.longitude.toFixed(4)}°
                      </p>
                    )}
                  </div>

                  <div className="text-right">
                    <span className={cn(
                      'inline-block px-2 py-1 rounded text-xs font-medium',
                      alert.severity === 'critical' && 'bg-red-500 text-white',
                      alert.severity === 'high' && 'bg-orange-500 text-white',
                      alert.severity === 'medium' && 'bg-yellow-500 text-black',
                      alert.severity === 'low' && 'bg-blue-500 text-white'
                    )}>
                      {alert.severity.toUpperCase()}
                    </span>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(alert.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}