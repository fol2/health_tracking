'use client'

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Bar,
} from 'recharts'
import { format } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Heart, Activity, Moon, Zap } from 'lucide-react'

interface HealthMetricsChartsProps {
  startDate: Date
  endDate: Date
  metrics?: string[]
  detailed?: boolean
}

interface MetricData {
  date: string
  bloodPressureSystolic?: number
  bloodPressureDiastolic?: number
  heartRate?: number
  bloodGlucose?: number
  sleepHours?: number
  sleepQuality?: number
  energyLevel?: number
  weight?: number
}

const METRIC_CONFIG = {
  blood_pressure: {
    icon: Heart,
    color: '#ef4444',
    unit: 'mmHg',
    normalRange: { systolic: [90, 120], diastolic: [60, 80] },
  },
  heart_rate: {
    icon: Activity,
    color: '#3b82f6',
    unit: 'bpm',
    normalRange: [60, 100],
  },
  sleep: {
    icon: Moon,
    color: '#8b5cf6',
    unit: 'hours',
    normalRange: [7, 9],
  },
  energy: {
    icon: Zap,
    color: '#f59e0b',
    unit: '/10',
    normalRange: [6, 10],
  },
}

export function HealthMetricsCharts({ 
  startDate, 
  endDate, 
  metrics = ['blood_pressure', 'heart_rate', 'sleep', 'energy'],
  detailed = false
}: HealthMetricsChartsProps) {
  const [data, setData] = useState<MetricData[]>([])
  const [loading, setLoading] = useState(true)
  const [correlations, setCorrelations] = useState<any>(null)

  useEffect(() => {
    const fetchHealthData = async () => {
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          metrics: metrics.join(','),
        })
        const response = await fetch(`/api/analytics/health?${params}`)
        if (!response.ok) throw new Error('Failed to fetch health data')
        const result = await response.json()

        if (result) {
          setData(result.chartData)
          setCorrelations(result.correlations)
        }
      } catch (error) {
        console.error('Failed to fetch health data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealthData()
  }, [startDate, endDate, metrics])

  if (loading) {
    return <Skeleton className="w-full h-[400px]" />
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">No health data available for this period</p>
      </div>
    )
  }

  const renderBloodPressureChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Blood Pressure
        </CardTitle>
        <CardDescription>
          Systolic and diastolic readings over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[40, 180]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            
            {/* Normal range areas */}
            <ReferenceLine y={120} stroke="#10b981" strokeDasharray="5 5" />
            <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" />
            
            <Area
              type="monotone"
              dataKey="bloodPressureSystolic"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.3}
              name="Systolic"
            />
            <Area
              type="monotone"
              dataKey="bloodPressureDiastolic"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Diastolic"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderHeartRateChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Heart Rate
        </CardTitle>
        <CardDescription>
          Resting heart rate measurements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[40, 120]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            
            {/* Normal range */}
            <ReferenceLine y={60} stroke="#10b981" strokeDasharray="5 5" label="Normal Min" />
            <ReferenceLine y={100} stroke="#10b981" strokeDasharray="5 5" label="Normal Max" />
            
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: '#3b82f6' }}
              name="Heart Rate (bpm)"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderSleepChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Moon className="h-5 w-5" />
          Sleep Pattern
        </CardTitle>
        <CardDescription>
          Sleep duration and quality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              yAxisId="hours"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[0, 12]}
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="quality"
              orientation="right"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[0, 10]}
              label={{ value: 'Quality', angle: 90, position: 'insideRight' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            
            <ReferenceLine yAxisId="hours" y={7} stroke="#10b981" strokeDasharray="5 5" />
            <ReferenceLine yAxisId="hours" y={9} stroke="#10b981" strokeDasharray="5 5" />
            
            <Bar
              yAxisId="hours"
              dataKey="sleepHours"
              fill="#8b5cf6"
              opacity={0.8}
              name="Sleep Hours"
            />
            <Line
              yAxisId="quality"
              type="monotone"
              dataKey="sleepQuality"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={{ fill: '#f59e0b' }}
              name="Sleep Quality"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  const renderEnergyChart = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Energy Levels
        </CardTitle>
        <CardDescription>
          Daily energy level tracking
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={[0, 10]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            
            <Area
              type="monotone"
              dataKey="energyLevel"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.3}
              strokeWidth={2}
              name="Energy Level"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )

  if (!detailed) {
    // Simple combined chart for overview
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date"
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <YAxis
            className="text-xs"
            tick={{ fill: 'currentColor' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
          
          {metrics.includes('heart_rate') && (
            <Line
              type="monotone"
              dataKey="heartRate"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              name="Heart Rate"
            />
          )}
          {metrics.includes('blood_pressure') && (
            <>
              <Line
                type="monotone"
                dataKey="bloodPressureSystolic"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                name="BP Systolic"
              />
              <Line
                type="monotone"
                dataKey="bloodPressureDiastolic"
                stroke="#ec4899"
                strokeWidth={2}
                dot={false}
                name="BP Diastolic"
              />
            </>
          )}
        </LineChart>
      </ResponsiveContainer>
    )
  }

  // Detailed view with tabs
  return (
    <div className="space-y-4">
      <Tabs defaultValue="blood_pressure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="blood_pressure">Blood Pressure</TabsTrigger>
          <TabsTrigger value="heart_rate">Heart Rate</TabsTrigger>
          <TabsTrigger value="sleep">Sleep</TabsTrigger>
          <TabsTrigger value="energy">Energy</TabsTrigger>
        </TabsList>

        <TabsContent value="blood_pressure">
          {renderBloodPressureChart()}
        </TabsContent>

        <TabsContent value="heart_rate">
          {renderHeartRateChart()}
        </TabsContent>

        <TabsContent value="sleep">
          {renderSleepChart()}
        </TabsContent>

        <TabsContent value="energy">
          {renderEnergyChart()}
        </TabsContent>
      </Tabs>

      {/* Correlation Analysis */}
      {correlations && (
        <Card>
          <CardHeader>
            <CardTitle>Correlation Analysis</CardTitle>
            <CardDescription>
              Relationships between different health metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {Object.entries(correlations).map(([key, value]: [string, any]) => (
                <div key={key} className="space-y-2">
                  <h4 className="text-sm font-medium">{key}</h4>
                  <div className="text-2xl font-bold">
                    {(value.correlation * 100).toFixed(0)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}