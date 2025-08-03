'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
} from 'recharts'
import { format } from 'date-fns'
import { useUserProfile } from '@/hooks/use-user-profile'
import { Skeleton } from '@/components/ui/skeleton'
import { calculateBMI } from '@/lib/utils/health-calculations'

interface WeightChartProps {
  startDate: Date
  endDate: Date
  height?: number
  showBMI?: boolean
  showTarget?: boolean
}

interface WeightData {
  date: string
  weight: number
  bmi?: number
}

const BMI_ZONES = {
  underweight: { min: 0, max: 18.5, color: '#3b82f6', label: 'Underweight' },
  normal: { min: 18.5, max: 25, color: '#10b981', label: 'Normal' },
  overweight: { min: 25, max: 30, color: '#f59e0b', label: 'Overweight' },
  obese: { min: 30, max: 100, color: '#ef4444', label: 'Obese' },
}

export function WeightChart({ 
  startDate, 
  endDate, 
  height = 350,
  showBMI = false,
  showTarget = false 
}: WeightChartProps) {
  const { profile } = useUserProfile()
  const [data, setData] = useState<WeightData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchWeightData = async () => {
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        const response = await fetch(`/api/analytics/weight?${params}`)
        if (!response.ok) throw new Error('Failed to fetch weight data')
        const result = await response.json()

        if (result) {
          const weightData = result.map((record: any) => ({
            date: format(new Date(record.recordedAt), 'MMM dd'),
            weight: record.weight,
            bmi: profile?.height ? calculateBMI(record.weight, profile.height) : undefined,
          }))
          setData(weightData)
        }
      } catch (error) {
        console.error('Failed to fetch weight data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchWeightData()
  }, [startDate, endDate, profile])

  if (loading) {
    return <Skeleton className="w-full" style={{ height }} />
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-muted-foreground">No weight data available for this period</p>
      </div>
    )
  }

  const minWeight = Math.min(...data.map(d => d.weight))
  const maxWeight = Math.max(...data.map(d => d.weight))
  const yAxisMin = Math.floor(minWeight * 0.95)
  const yAxisMax = Math.ceil(maxWeight * 1.05)

  // Calculate BMI range for the chart if showing BMI zones
  const bmiYMin = showBMI && profile?.height ? 
    Math.floor(calculateBMI(yAxisMin, profile.height)) : 0
  const bmiYMax = showBMI && profile?.height ? 
    Math.ceil(calculateBMI(yAxisMax, profile.height)) : 40

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        
        <XAxis 
          dataKey="date"
          className="text-xs"
          tick={{ fill: 'currentColor' }}
        />
        
        <YAxis
          domain={[yAxisMin, yAxisMax]}
          className="text-xs"
          tick={{ fill: 'currentColor' }}
          label={{ 
            value: 'Weight (kg)', 
            angle: -90, 
            position: 'insideLeft',
            style: { fill: 'currentColor' }
          }}
        />

        {showBMI && profile?.height && (
          <YAxis
            yAxisId="bmi"
            orientation="right"
            domain={[bmiYMin, bmiYMax]}
            className="text-xs"
            tick={{ fill: 'currentColor' }}
            label={{ 
              value: 'BMI', 
              angle: 90, 
              position: 'insideRight',
              style: { fill: 'currentColor' }
            }}
          />
        )}

        {/* BMI Reference Areas */}
        {showBMI && profile?.height && (
          <>
            <ReferenceArea
              yAxisId="bmi"
              y1={BMI_ZONES.underweight.min}
              y2={BMI_ZONES.underweight.max}
              fill={BMI_ZONES.underweight.color}
              fillOpacity={0.1}
              label={{ value: BMI_ZONES.underweight.label, position: 'right' }}
            />
            <ReferenceArea
              yAxisId="bmi"
              y1={BMI_ZONES.normal.min}
              y2={BMI_ZONES.normal.max}
              fill={BMI_ZONES.normal.color}
              fillOpacity={0.1}
              label={{ value: BMI_ZONES.normal.label, position: 'right' }}
            />
            <ReferenceArea
              yAxisId="bmi"
              y1={BMI_ZONES.overweight.min}
              y2={BMI_ZONES.overweight.max}
              fill={BMI_ZONES.overweight.color}
              fillOpacity={0.1}
              label={{ value: BMI_ZONES.overweight.label, position: 'right' }}
            />
            <ReferenceArea
              yAxisId="bmi"
              y1={BMI_ZONES.obese.min}
              y2={Math.min(BMI_ZONES.obese.max, bmiYMax)}
              fill={BMI_ZONES.obese.color}
              fillOpacity={0.1}
              label={{ value: BMI_ZONES.obese.label, position: 'right' }}
            />
          </>
        )}

        {/* Target Weight Line */}
        {showTarget && profile?.targetWeight && (
          <ReferenceLine
            y={profile.targetWeight}
            stroke="#8b5cf6"
            strokeDasharray="5 5"
            label={{ value: 'Target', position: 'left' }}
          />
        )}

        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }}
          labelStyle={{ color: 'hsl(var(--foreground))' }}
          formatter={(value: number, name: string) => {
            if (name === 'Weight') return [`${value.toFixed(1)} kg`, name]
            if (name === 'BMI') return [value.toFixed(1), name]
            return [value, name]
          }}
        />

        <Legend />

        <Line
          type="monotone"
          dataKey="weight"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ fill: '#8b5cf6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Weight"
        />

        {showBMI && data[0]?.bmi && (
          <Line
            yAxisId="bmi"
            type="monotone"
            dataKey="bmi"
            stroke="#06b6d4"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#06b6d4', r: 3 }}
            name="BMI"
          />
        )}
      </LineChart>
    </ResponsiveContainer>
  )
}