import { MetricCard } from './MetricCard'
import { AlertPanel } from './AlertPanel'
import { Flame, Wind, Droplets, AlertTriangle } from 'lucide-react'
import { formatNumber, formatPercent } from '@/lib/utils'

interface PredictionDashboardProps {
  prediction: any
  fireData: any
  weatherData: any
}

export function PredictionDashboard({
  prediction,
  fireData,
  weatherData
}: PredictionDashboardProps) {
  // Extract key metrics
  const activeFires = fireData?.active_fires?.length || 0
  const windSpeed = weatherData?.current_conditions?.avg_wind_speed || 0
  const humidity = weatherData?.current_conditions?.avg_humidity || 0
  const highRiskCells = prediction?.predictions?.[0]?.high_risk_cells?.length || 0

  return (
    <div className="p-6 space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Fires"
          value={formatNumber(activeFires)}
          icon={<Flame className="h-5 w-5" />}
          trend={activeFires > 10 ? 'up' : 'neutral'}
        />

        <MetricCard
          title="Wind Speed"
          value={`${formatNumber(windSpeed, 1)} mph`}
          icon={<Wind className="h-5 w-5" />}
          trend={windSpeed > 20 ? 'up' : 'neutral'}
        />

        <MetricCard
          title="Humidity"
          value={formatPercent(humidity / 100)}
          icon={<Droplets className="h-5 w-5" />}
          trend={humidity < 30 ? 'down' : 'neutral'}
        />

        <MetricCard
          title="High Risk Areas"
          value={formatNumber(highRiskCells)}
          icon={<AlertTriangle className="h-5 w-5" />}
          trend={highRiskCells > 5 ? 'up' : 'neutral'}
        />
      </div>

      {/* Prediction Details */}
      {prediction && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Latest Prediction</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-400">Model Type</p>
              <p className="font-medium">{prediction.metadata?.model_type || 'Unknown'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Accuracy Estimate</p>
              <p className="font-medium">{formatPercent(prediction.metadata?.accuracy_estimate || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Execution Time</p>
              <p className="font-medium">{formatNumber(prediction.metadata?.execution_time || 0, 1)}s</p>
            </div>
            <div>
              <p className="text-sm text-gray-400">Quantum Backend</p>
              <p className="font-medium">{prediction.metadata?.quantum_backend || 'Simulator'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fire Conditions */}
      {fireData && (
        <div className="glass rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Fire Conditions</h3>
          <div className="space-y-3">
            {fireData.active_fires?.slice(0, 5).map((fire: any, index: number) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <div>
                  <p className="font-medium">Fire #{index + 1}</p>
                  <p className="text-sm text-gray-400">
                    Intensity: {formatPercent(fire.intensity || 0)} |
                    Area: {formatNumber(fire.area_hectares || 0)} ha
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">
                    {formatNumber(fire.center_lat || 0, 4)}°, {formatNumber(fire.center_lon || 0, 4)}°
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}