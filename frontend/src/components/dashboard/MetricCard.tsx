import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts'
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertCircle,
  CheckCircle,
  HelpCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
// Defines the shape of props for this highly configurable component.

// The possible trends for the metric's value.
type TrendDirection = 'up' | 'down' | 'neutral'

// A single data point for the historical trend chart.
export interface HistoricalDataPoint {
  timestamp: number | string
  value: number
}

export interface MetricCardProps {
  /** The main title of the metric card. */
  title: string

  /** The current value to be displayed. Can be a string or a number. */
  value: string | number

  /** An optional subtitle or unit for the value (e.g., 'mph', 'fires'). */
  unit?: string

  /** A React node (typically a Lucide icon) to be displayed in the card. */
  icon: React.ReactNode

  /** A series of historical data points to render a sparkline chart. */
  historicalData?: HistoricalDataPoint[]

  /**
   * The display mode for the card.
   * 'value': Shows the large value.
   * 'chart': Shows the sparkline chart.
   */
  mode?: 'value' | 'chart'

  /**
   * Optional manual trend direction. If not provided, it will be calculated
   * from `historicalData` if available.
   */
  trend?: TrendDirection

  /** The number of recent data points to consider for trend calculation. */
  trendLookback?: number

  /** Optional thresholds for conditional styling. */
  thresholds?: {
    warning?: number
    critical?: number
  }

  /** Additional CSS classes for custom styling. */
  className?: string

  /**
   * Enables or disables the detailed tooltip on hover.
   * @default true
   */
  tooltipEnabled?: boolean
}

// --- UTILITY FUNCTIONS ---

/**
 * Calculates the trend direction and percentage change from a series of data.
 * @param {HistoricalDataPoint[]} data - The historical data series.
 * @param {number} lookback - The number of points to compare.
 * @returns An object containing the trend direction and percentage change.
 */
const calculateTrend = (data?: HistoricalDataPoint[], lookback: number = 5) => {
  if (!data || data.length < 2) {
    return { direction: 'neutral' as TrendDirection, percentChange: 0 }
  }

  const relevantData = data.slice(-lookback)
  if (relevantData.length < 2) {
    return { direction: 'neutral' as TrendDirection, percentChange: 0 }
  }

  const latestValue = relevantData[relevantData.length - 1]?.value
  const previousValue = relevantData[0]?.value

  if (latestValue === undefined || previousValue === undefined || previousValue === 0) {
    return { direction: 'neutral' as TrendDirection, percentChange: 0 }
  }

  const change = latestValue - previousValue
  const percentChange = (change / previousValue) * 100

  let direction: TrendDirection = 'neutral'
  if (change > 0) direction = 'up'
  if (change < 0) direction = 'down'

  return { direction, percentChange }
}


/**
 * A sophisticated, reusable component for displaying a single key metric.
 * It can show values, trends, and historical data in a compact format.
 */
export function MetricCard({
                             title,
                             value,
                             unit,
                             icon,
                             historicalData,
                             mode = 'value',
                             trend: manualTrend,
                             trendLookback = 5,
                             thresholds,
                             className,
                             tooltipEnabled = true
                           }: MetricCardProps) {

  // --- MEMOIZED CALCULATIONS ---
  // Memoization prevents expensive calculations on every render.

  const { direction: calculatedTrend, percentChange } = useMemo(
      () => calculateTrend(historicalData, trendLookback),
      [historicalData, trendLookback]
  )

  const finalTrend = manualTrend || calculatedTrend

  // Determine the card's status based on value and thresholds.
  const status = useMemo(() => {
    const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
    if (isNaN(numericValue) || !thresholds) return 'default'
    if (thresholds.critical !== undefined && numericValue >= thresholds.critical) return 'critical'
    if (thresholds.warning !== undefined && numericValue >= thresholds.warning) return 'warning'
    return 'default'
  }, [value, thresholds])


  // --- DYNAMIC STYLING ---
  // Dynamically generate class names based on trend and status.

  const trendIcon = useMemo(() => {
    const style = 'h-4 w-4'
    switch (finalTrend) {
      case 'up': return <ArrowUpRight className={cn(style, 'text-red-500')} />
      case 'down': return <ArrowDownRight className={cn(style, 'text-green-500')} />
      default: return <Minus className={cn(style, 'text-gray-500')} />
    }
  }, [finalTrend])

  const statusIcon = useMemo(() => {
    const style = 'h-4 w-4'
    switch(status) {
      case 'critical': return <AlertCircle className={cn(style, 'text-red-400')} />
      case 'warning': return <AlertCircle className={cn(style, 'text-yellow-400')} />
      default: return <CheckCircle className={cn(style, 'text-green-500')} />
    }
  }, [status])

  const cardClasses = cn(
      'bg-gray-900/50 border border-gray-800 rounded-xl p-4 transition-all duration-300',
      'hover:bg-gray-800/60 hover:border-gray-700',
      {
        'border-yellow-500/30 hover:border-yellow-500/50': status === 'warning',
        'border-red-500/40 hover:border-red-500/60': status === 'critical',
      },
      className
  )

  const valueClasses = cn(
      'text-3xl font-bold text-white',
      {
        'text-yellow-400': status === 'warning',
        'text-red-400': status === 'critical'
      }
  )


  // --- RENDER HELPER COMPONENTS ---

  const renderValue = () => (
      <div className="flex items-baseline gap-2">
      <span className={valueClasses}>
          {typeof value === 'number' ? value.toLocaleString() : value}
      </span>
        {unit && <span className="text-sm font-medium text-gray-400">{unit}</span>}
      </div>
  )

  const renderChart = () => (
      <div className="h-16 w-full">
        {historicalData && historicalData.length > 1 ? (
            <ResponsiveContainer>
              <LineChart data={historicalData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={status === 'critical' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#22c55e'}
                    strokeWidth={2}
                    dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
        ) : (
            <div className="flex items-center justify-center h-full text-xs text-gray-600">
              No historical data available.
            </div>
        )}
      </div>
  )

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && tooltipEnabled) {
      const point = payload[0].payload as HistoricalDataPoint;
      const pointValue = typeof value === 'number' ? point.value.toLocaleString() : point.value;
      const timeLabel = new Date(point.timestamp).toLocaleTimeString();
      const histMin = Math.min(...(historicalData?.map(d => d.value) || [0]));
      const histMax = Math.max(...(historicalData?.map(d => d.value) || [0]));

      return (
          <div className="bg-gray-950 border border-gray-700 rounded-lg p-3 text-white shadow-xl text-xs">
            <p className="font-bold mb-2">{title} - History</p>
            <p className="mb-2"><span className="font-semibold text-blue-400">{pointValue}</span> at {timeLabel}</p>
            <div className="border-t border-gray-700 pt-2 space-y-1">
              <div className="flex justify-between gap-4">
                <span>Min:</span>
                <span>{histMin.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Max:</span>
                <span>{histMax.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Change:</span>
                <span className={cn(
                    finalTrend === 'up' && 'text-red-400',
                    finalTrend === 'down' && 'text-green-400',
                )}>
                        {percentChange.toFixed(1)}%
                    </span>
              </div>
            </div>
          </div>
      );
    }
    return null;
  };


  return (
      <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={cardClasses}
      >
        <RechartsTooltip content={<CustomTooltip />} cursor={false} wrapperStyle={{ zIndex: 50 }} />
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="flex-shrink-0">{icon}</div>
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
          </div>
          {tooltipEnabled ? statusIcon : <HelpCircle className="h-4 w-4 text-gray-600" />}
        </div>

        <div className="mt-2">
          {mode === 'chart' ? renderChart() : renderValue()}
        </div>

        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            {trendIcon}
            <span>
                    {finalTrend !== 'neutral' ? `${Math.abs(percentChange).toFixed(1)}%` : 'No change'}
                </span>
            <span>vs prev. period</span>
          </div>
          <p>Last updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </motion.div>
  )
}