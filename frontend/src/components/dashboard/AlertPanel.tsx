import React, { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertTriangle, CheckCircle,
  ChevronDown,
  ChevronUp,
  Filter,
  ShieldAlert,
  Siren,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Alert } from '@/hooks/useRealTimeData' // Assuming Alert type is exported from the hook

// --- TYPE DEFINITIONS ---

type AlertSeverity = 'critical' | 'high' | 'moderate'
type FilterLevel = 'all' | 'high' | 'critical'

// Configuration object for styling and icons based on severity.
const SEVERITY_CONFIG: Record<
    AlertSeverity,
    { icon: React.ReactNode; colorClasses: string; label: string }
> = {
  critical: {
    icon: <Siren className="h-5 w-5" />,
    colorClasses: 'bg-red-900/50 border-red-500/60 text-red-300',
    label: 'Critical',
  },
  high: {
    icon: <ShieldAlert className="h-5 w-5" />,
    colorClasses: 'bg-orange-900/50 border-orange-500/60 text-orange-300',
    label: 'High',
  },
  moderate: {
    icon: <AlertTriangle className="h-5 w-5" />,
    colorClasses: 'bg-yellow-900/50 border-yellow-500/60 text-yellow-300',
    label: 'Moderate',
  },
}

// --- UTILITY FUNCTIONS ---

/**
 * Formats the time difference between now and a given timestamp into a human-readable string.
 * @param {string | Date} timestamp - The timestamp to compare.
 * @returns {string} A string like "2m ago" or "now".
 */
const formatTimeSince = (timestamp: string | Date): string => {
  const now = new Date()
  const then = new Date(timestamp)
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000)

  if (seconds < 5) return 'now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// --- COMPONENT PROPS INTERFACE ---

export interface AlertPanelProps {
  /** An array of alert objects to be displayed. */
  alerts: Alert[]

  /**
   * The initial collapsed state of the panel.
   * @default false
   */
  defaultCollapsed?: boolean

  /** Additional CSS classes for custom styling of the container. */
  className?: string
}

/**
 * A sophisticated, interactive panel for displaying and filtering real-time system alerts.
 */
export function AlertPanel({
                             alerts,
                             defaultCollapsed = false,
                             className,
                           }: AlertPanelProps) {
  // --- STATE MANAGEMENT ---
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [filter, setFilter] = useState<FilterLevel>('all')
  const [timeStamps, setTimeStamps] = useState<Record<string, string>>({})

  // --- EFFECT HOOKS ---
  // Set up an interval to periodically update the "time since" strings for alerts.
  useEffect(() => {
    const updateTimestamps = () => {
      const newTimeStamps: Record<string, string> = {}
      for (const alert of alerts) {
        newTimeStamps[alert.id] = formatTimeSince(alert.timestamp)
      }
      setTimeStamps(newTimeStamps)
    }

    updateTimestamps() // Update immediately on alert change
    const interval = setInterval(updateTimestamps, 10000) // And then every 10 seconds

    return () => clearInterval(interval) // Cleanup interval on unmount
  }, [alerts])

  // --- MEMOIZED DATA ---
  // Memoize the filtered alerts to prevent re-calculation on every render.
  const filteredAlerts = useMemo(() => {
    if (filter === 'all') {
      return alerts
    }
    if (filter === 'high') {
      return alerts.filter(
          (a) => a.severity === 'critical' || a.severity === 'high'
      )
    }
    if (filter === 'critical') {
      return alerts.filter((a) => a.severity === 'critical')
    }
    return []
  }, [alerts, filter])

  const criticalAlertCount = useMemo(
      () => alerts.filter((a) => a.severity === 'critical').length,
      [alerts]
  )

  // --- RENDER HELPER COMPONENTS ---

  const renderFilterControls = () => (
      <div className="flex items-center gap-2 px-3 py-2 bg-gray-950/50">
        <Filter className="h-4 w-4 text-gray-400" />
        <div className="flex items-center gap-1 rounded-lg bg-gray-800 p-1">
          {(['all', 'high', 'critical'] as FilterLevel[]).map((level) => (
              <button
                  key={level}
                  onClick={() => setFilter(level)}
                  className={cn(
                      'px-2 py-0.5 text-xs rounded-md font-medium transition-colors',
                      'capitalize',
                      filter === level
                          ? 'bg-red-600 text-white'
                          : 'text-gray-300 hover:bg-gray-700'
                  )}
              >
                {level}
              </button>
          ))}
        </div>
      </div>
  )

  const renderEmptyState = () => (
      <div className="text-center py-8 px-4">
        <div className="w-12 h-12 bg-green-900/50 border-2 border-green-500/60 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-6 w-6 text-green-400" />
        </div>
        <h4 className="mt-4 font-semibold text-white">All Systems Clear</h4>
        <p className="mt-1 text-sm text-gray-400">
          No active alerts to display.
        </p>
      </div>
  )

  const renderAlertItem = (alert: Alert) => {
    const config = SEVERITY_CONFIG[alert.severity]
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            key={alert.id}
            className={cn(
                'p-3 border-l-4 flex items-start gap-3',
                config.colorClasses
            )}
        >
          <div className="flex-shrink-0 mt-0.5">{config.icon}</div>
          <div className="flex-grow">
            <div className="flex justify-between items-baseline">
              <h4 className="font-bold text-sm text-white">{alert.title}</h4>
              <span className="text-xs text-gray-400 font-mono">
              {timeStamps[alert.id] || '...'}
            </span>
            </div>
            <p className="text-sm leading-snug mt-1">{alert.message}</p>
            {alert.location && (
                <p className="text-xs text-blue-400 mt-1">{alert.location.name}</p>
            )}
          </div>
        </motion.div>
    )
  }

  // --- MAIN RENDER ---
  return (
      <motion.div
          layout
          className={cn(
              'bg-gray-900/70 backdrop-blur-sm border border-gray-700/80 rounded-lg overflow-hidden',
              className
          )}
      >
        {/* Panel Header */}
        <div
            className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-800/50 transition-colors"
            onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-white">System Alerts</h3>
            {criticalAlertCount > 0 && (
                <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full"
                >
                  {criticalAlertCount} Critical
                </motion.span>
            )}
          </div>
          <button className="text-gray-400 hover:text-white">
            {isCollapsed ? (
                <ChevronDown className="h-5 w-5" />
            ) : (
                <ChevronUp className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence initial={false}>
          {!isCollapsed && (
              <motion.div
                  key="content"
                  initial="collapsed"
                  animate="open"
                  exit="collapsed"
                  variants={{
                    open: { opacity: 1, height: 'auto' },
                    collapsed: { opacity: 0, height: 0 },
                  }}
                  transition={{ duration: 0.4, ease: 'easeInOut' }}
                  className="overflow-hidden"
              >
                {renderFilterControls()}

                <div className="max-h-[350px] overflow-y-auto">
                  {filteredAlerts.length > 0 ? (
                      <div className="space-y-2 p-2">
                        <AnimatePresence>
                          {filteredAlerts.map(renderAlertItem)}
                        </AnimatePresence>
                      </div>
                  ) : (
                      renderEmptyState()
                  )}
                </div>
              </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
  )
}