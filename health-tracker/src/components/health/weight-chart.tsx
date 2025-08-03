'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { useHealthMetricsStore } from '@/store/health-metrics-store'
import { useUserProfileStore } from '@/store/user-profile-store'
import { 
  convertWeight, 
  WeightUnits, 
  type WeightUnit,
  formatWeight
} from '@/lib/utils/health-calculations'
import { TrendingUp, TrendingDown, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WeightChartProps {
  days?: 7 | 30 | 90 | 365
}

export function WeightChart({ days = 30 }: WeightChartProps) {
  const { weightHistory, fetchWeightHistory } = useHealthMetricsStore()
  const { profile } = useUserProfileStore()
  
  const [unit, setUnit] = useState<WeightUnit>(
    profile?.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG
  )

  useEffect(() => {
    fetchWeightHistory(days === 365 ? 100 : days)
  }, [days, fetchWeightHistory])

  useEffect(() => {
    if (profile?.unitsPreference) {
      setUnit(profile.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG)
    }
  }, [profile?.unitsPreference])

  // Filter data by selected time period
  const getFilteredData = () => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)
    
    return weightHistory
      .filter(record => new Date(record.recordedAt) >= cutoffDate)
      .reverse() // Show oldest first for chart
  }

  const data = getFilteredData()

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Weight Trend</h3>
        <div className="text-center text-muted-foreground py-8">
          No weight data for the selected period
        </div>
      </Card>
    )
  }

  // Calculate min and max for scaling
  const weights = data.map(d => d.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 1
  const padding = range * 0.1

  // Simple ASCII chart
  const chartHeight = 10
  const chartWidth = Math.min(data.length, 30)
  
  const getChartY = (weight: number) => {
    const normalized = (weight - (minWeight - padding)) / (range + 2 * padding)
    return Math.round((1 - normalized) * (chartHeight - 1))
  }

  // Create chart grid
  const chart: string[][] = Array(chartHeight).fill(null).map(() => 
    Array(chartWidth).fill(' ')
  )

  // Plot points
  data.slice(-chartWidth).forEach((record, i) => {
    const y = getChartY(record.weight)
    if (y >= 0 && y < chartHeight) {
      chart[y][i] = '●'
    }
  })

  // Add connecting lines
  for (let i = 1; i < chartWidth && i < data.length; i++) {
    const prevY = getChartY(data[data.length - chartWidth + i - 1].weight)
    const currY = getChartY(data[data.length - chartWidth + i].weight)
    
    if (prevY !== currY) {
      const minY = Math.min(prevY, currY)
      const maxY = Math.max(prevY, currY)
      for (let y = minY + 1; y < maxY; y++) {
        if (chart[y][i] === ' ') {
          chart[y][i] = '│'
        }
      }
    }
  }

  const trend = data.length >= 2 
    ? data[data.length - 1].weight > data[0].weight ? 'up' : 'down'
    : null

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Weight Trend</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" />
          Last {days} days
        </div>
      </div>

      {/* ASCII Chart */}
      <div className="font-mono text-xs bg-muted/50 p-4 rounded-lg overflow-x-auto">
        <pre>
          {chart.map((row, y) => (
            <div key={y} className="flex">
              <span className="text-muted-foreground mr-2">
                {y === 0 ? formatWeight(
                  convertWeight(maxWeight + padding, WeightUnits.KG, unit), 
                  unit, 
                  0
                ).padStart(6) : 
                 y === chartHeight - 1 ? formatWeight(
                  convertWeight(minWeight - padding, WeightUnits.KG, unit), 
                  unit, 
                  0
                ).padStart(6) : '      '}
              </span>
              <span>{row.join('')}</span>
            </div>
          ))}
        </pre>
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <div>
          <span className="text-muted-foreground">Start: </span>
          <span className="font-medium">
            {formatWeight(
              convertWeight(data[0].weight, WeightUnits.KG, unit),
              unit
            )}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {trend && (
            trend === 'up' ? (
              <TrendingUp className="h-4 w-4 text-red-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-green-500" />
            )
          )}
          <span className="text-muted-foreground">Current: </span>
          <span className="font-medium">
            {formatWeight(
              convertWeight(data[data.length - 1].weight, WeightUnits.KG, unit),
              unit
            )}
          </span>
        </div>
      </div>
    </Card>
  )
}