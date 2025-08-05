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
import { TrendingUp, TrendingDown, CalendarDays, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
} from 'recharts'
import { format } from 'date-fns'

interface WeightTrendChartProps {
  days?: 7 | 30 | 90 | 365
}

export function WeightTrendChart({ days = 30 }: WeightTrendChartProps) {
  const { weightHistory, fetchWeightHistory } = useHealthMetricsStore()
  const { profile } = useUserProfileStore()
  
  const [unit, setUnit] = useState<WeightUnit>(
    profile?.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG
  )
  const [selectedDays, setSelectedDays] = useState(days)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await fetchWeightHistory(selectedDays === 365 ? 100 : selectedDays)
      setIsLoading(false)
    }
    loadData()
  }, [selectedDays, fetchWeightHistory])

  useEffect(() => {
    if (profile?.unitsPreference) {
      setUnit(profile.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG)
    }
  }, [profile?.unitsPreference])

  // Filter and format data for chart
  const getChartData = () => {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - selectedDays)
    
    return weightHistory
      .filter(record => new Date(record.recordedAt) >= cutoffDate)
      .reverse() // Show oldest first for chart
      .map(record => ({
        date: format(new Date(record.recordedAt), 'MMM dd'),
        fullDate: new Date(record.recordedAt).toLocaleDateString('en-GB'),
        weight: unit === WeightUnits.KG 
          ? record.weight 
          : convertWeight(record.weight, WeightUnits.KG, unit),
        rawWeight: record.weight,
        notes: record.notes,
      }))
  }

  const data = getChartData()

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Card>
    )
  }

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

  // Calculate statistics
  const weights = data.map(d => d.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
  const latestWeight = weights[weights.length - 1]
  const startWeight = weights[0]
  const changePercent = ((latestWeight - startWeight) / startWeight) * 100

  // Calculate target line if user has a target weight
  const targetWeight = profile?.targetWeight 
    ? unit === WeightUnits.KG 
      ? profile.targetWeight 
      : convertWeight(profile.targetWeight, WeightUnits.KG, unit)
    : null

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold">{data.fullDate}</p>
          <p className="text-sm">
            Weight: <span className="font-medium">{formatWeight(data.weight, unit)}</span>
          </p>
          {data.notes && (
            <p className="text-xs text-muted-foreground mt-1">{data.notes}</p>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Weight Trend</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value) as any)}
              className="text-sm border rounded-md px-2 py-1 bg-background"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[minWeight * 0.98, maxWeight * 1.02]}
              tickFormatter={(value) => formatWeight(value, unit, 0)}
            />
            <Tooltip content={<CustomTooltip />} />
            {targetWeight && (
              <ReferenceLine 
                y={targetWeight} 
                stroke="#ef4444" 
                strokeDasharray="5 5"
                label={{ value: "Target", position: "right", className: "text-xs fill-red-500" }}
              />
            )}
            <ReferenceLine 
              y={avgWeight} 
              stroke="#6b7280" 
              strokeDasharray="3 3"
              label={{ value: "Avg", position: "right", className: "text-xs fill-muted-foreground" }}
            />
            <Area
              type="monotone"
              dataKey="weight"
              stroke="#8884d8"
              fillOpacity={1}
              fill="url(#colorWeight)"
            />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#8884d8"
              strokeWidth={2}
              dot={{ fill: '#8884d8', r: 3 }}
              activeDot={{ r: 5 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-muted-foreground">Start</p>
          <p className="font-semibold">{formatWeight(startWeight, unit)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Current</p>
          <p className="font-semibold flex items-center gap-1">
            {formatWeight(latestWeight, unit)}
            {changePercent !== 0 && (
              changePercent > 0 ? (
                <TrendingUp className="h-3 w-3 text-red-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-green-500" />
              )
            )}
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Change</p>
          <p className={cn(
            "font-semibold",
            changePercent > 0 ? "text-red-500" : changePercent < 0 ? "text-green-500" : ""
          )}>
            {changePercent > 0 && "+"}
            {changePercent.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">Average</p>
          <p className="font-semibold">{formatWeight(avgWeight, unit)}</p>
        </div>
      </div>
    </Card>
  )
}