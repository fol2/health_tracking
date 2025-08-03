'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { useHealthMetricsStore } from '@/store/health-metrics-store'
import { formatHealthDate } from '@/lib/utils/health-calculations'
import { 
  Heart, 
  Activity, 
  Droplets, 
  Moon, 
  Battery,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/lib/utils'

const metricIcons: Record<string, React.ReactNode> = {
  blood_pressure: <Heart className="h-4 w-4" />,
  heart_rate: <Activity className="h-4 w-4" />,
  blood_glucose: <Droplets className="h-4 w-4" />,
  sleep_hours: <Moon className="h-4 w-4" />,
  water_intake: <Droplets className="h-4 w-4" />,
  energy_level: <Battery className="h-4 w-4" />,
}

const metricUnits: Record<string, string> = {
  blood_pressure: 'mmHg',
  heart_rate: 'bpm',
  blood_glucose: 'mg/dL',
  sleep_hours: 'hours',
  water_intake: 'litres',
  energy_level: '/10',
}

export function RecentMetrics() {
  const { metrics, fetchAllMetrics, isLoading } = useHealthMetricsStore()

  useEffect(() => {
    fetchAllMetrics()
  }, [fetchAllMetrics])

  const formatMetricValue = (type: string, value: any): string => {
    if (type === 'blood_pressure' && typeof value === 'object') {
      return `${value.systolic}/${value.diastolic}`
    }
    if (typeof value === 'number') {
      return type === 'sleep_hours' || type === 'water_intake' 
        ? value.toFixed(1) 
        : value.toString()
    }
    return value.toString()
  }

  const getMetricTrend = (metricHistory: any[]): React.ReactNode => {
    if (metricHistory.length < 2) return null

    const current = metricHistory[0].value
    const previous = metricHistory[1].value

    let diff = 0
    if (typeof current === 'number' && typeof previous === 'number') {
      diff = current - previous
    } else if (typeof current === 'object' && current.systolic) {
      // For blood pressure, use systolic for trend
      diff = current.systolic - previous.systolic
    }

    if (diff === 0) return null

    return diff > 0 ? (
      <TrendingUp className="h-3 w-3 text-muted-foreground" />
    ) : (
      <TrendingDown className="h-3 w-3 text-muted-foreground" />
    )
  }

  if (isLoading && Object.keys(metrics).length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          Loading recent metrics...
        </div>
      </Card>
    )
  }

  const metricTypes = Object.keys(metrics).filter(type => metrics[type].length > 0)

  if (metricTypes.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Metrics</h3>
        <p className="text-sm text-muted-foreground">
          No health metrics recorded yet. Start tracking your health metrics to see them here.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Recent Metrics</h3>
      <div className="space-y-3">
        {metricTypes.map(type => {
          const latestMetric = metrics[type][0]
          const icon = metricIcons[type] || <Activity className="h-4 w-4" />
          const unit = latestMetric.unit || metricUnits[type] || ''
          const trend = getMetricTrend(metrics[type])

          return (
            <div
              key={type}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-background">
                  {icon}
                </div>
                <div>
                  <div className="font-medium capitalize">
                    {type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatHealthDate(latestMetric.recordedAt)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-right">
                <div>
                  <div className="font-semibold">
                    {formatMetricValue(type, latestMetric.value)} {unit}
                  </div>
                  {latestMetric.notes && (
                    <div className="text-xs text-muted-foreground truncate max-w-[100px]">
                      {latestMetric.notes}
                    </div>
                  )}
                </div>
                {trend}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}