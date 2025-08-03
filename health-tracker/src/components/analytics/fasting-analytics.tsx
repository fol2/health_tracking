'use client'

import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { format, eachDayOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Clock, TrendingUp, Calendar, Award } from 'lucide-react'

interface FastingAnalyticsProps {
  startDate: Date
  endDate: Date
  view?: 'weekly' | 'daily' | 'detailed'
  chartType?: 'hours' | 'completion' | 'types'
}

interface FastingData {
  date: string
  totalHours: number
  completedSessions: number
  averageDuration: number
  completionRate: number
}

interface FastingTypeData {
  type: string
  count: number
  totalHours: number
  color: string
}

const FASTING_TYPE_COLORS = {
  '16:8': '#8b5cf6',
  '18:6': '#3b82f6',
  '24h': '#10b981',
  '36h': '#f59e0b',
  '48h': '#ef4444',
  'custom': '#6b7280',
}

export function FastingAnalytics({ 
  startDate, 
  endDate, 
  view = 'weekly',
  chartType = 'hours'
}: FastingAnalyticsProps) {
  const [data, setData] = useState<FastingData[]>([])
  const [typeData, setTypeData] = useState<FastingTypeData[]>([])
  const [stats, setStats] = useState({
    totalHours: 0,
    totalSessions: 0,
    averageDuration: 0,
    longestStreak: 0,
    currentStreak: 0,
    completionRate: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFastingData = async () => {
      try {
        const params = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          view,
        })
        
        const response = await fetch(`/api/analytics/fasting?${params}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch fasting data')
        }
        
        const result = await response.json()

        if (result) {
          setData(result.chartData)
          setTypeData(result.typeData)
          setStats(result.stats)
        }
      } catch (error) {
        console.error('Failed to fetch fasting data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchFastingData()
  }, [startDate, endDate, view])

  if (loading) {
    return <Skeleton className="w-full h-[400px]" />
  }

  const renderHeatmap = () => {
    const days = eachDayOfInterval({ start: startDate, end: endDate })
    const weeks = Math.ceil(days.length / 7)
    
    return (
      <div className="space-y-2">
        <div className="flex gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="w-8 text-xs text-center text-muted-foreground">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, index) => {
            const dayData = data.find(d => d.date === format(day, 'yyyy-MM-dd'))
            const intensity = dayData ? dayData.totalHours / 24 : 0
            
            return (
              <div
                key={index}
                className="w-8 h-8 rounded"
                style={{
                  backgroundColor: intensity > 0 
                    ? `hsl(var(--primary) / ${Math.min(intensity * 100, 100)}%)`
                    : 'hsl(var(--muted))',
                }}
                title={`${format(day, 'MMM dd')}: ${dayData?.totalHours || 0} hours`}
              />
            )
          })}
        </div>
      </div>
    )
  }

  if (view === 'detailed') {
    return (
      <div className="space-y-4">
        {/* Summary Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalHours.toFixed(0)}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalSessions} sessions completed
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Duration</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageDuration.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground">
                Per fasting session
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.currentStreak} days</div>
              <p className="text-xs text-muted-foreground">
                Longest: {stats.longestStreak} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completionRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">
                Of scheduled fasts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="hours" className="space-y-4">
          <TabsList>
            <TabsTrigger value="hours">Hours by Week</TabsTrigger>
            <TabsTrigger value="types">By Type</TabsTrigger>
            <TabsTrigger value="heatmap">Activity Heatmap</TabsTrigger>
            <TabsTrigger value="completion">Completion Rate</TabsTrigger>
          </TabsList>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Fasting Hours by Week</CardTitle>
                <CardDescription>
                  Total hours fasted each week
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={data}>
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
                    <Bar 
                      dataKey="totalHours" 
                      fill="hsl(var(--primary))"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types">
            <Card>
              <CardHeader>
                <CardTitle>Fasting by Type</CardTitle>
                <CardDescription>
                  Distribution of fasting sessions by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={typeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, count }) => `${type}: ${count}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {typeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={FASTING_TYPE_COLORS[entry.type as keyof typeof FASTING_TYPE_COLORS] || '#6b7280'} 
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Type Breakdown</h4>
                    {typeData.map((type) => (
                      <div key={type.type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: type.color }}
                          />
                          <span className="text-sm">{type.type}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {type.count} sessions ({type.totalHours.toFixed(0)}h)
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heatmap">
            <Card>
              <CardHeader>
                <CardTitle>Fasting Activity Heatmap</CardTitle>
                <CardDescription>
                  Daily fasting activity intensity
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderHeatmap()}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completion">
            <Card>
              <CardHeader>
                <CardTitle>Completion Rate Trend</CardTitle>
                <CardDescription>
                  Percentage of completed vs planned fasts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
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
                      domain={[0, 100]}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => `${value.toFixed(0)}%`}
                    />
                    <Line 
                      type="monotone"
                      dataKey="completionRate" 
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Simple view for dashboard
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
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
        <Bar 
          dataKey={chartType === 'hours' ? 'totalHours' : 'completedSessions'} 
          fill="hsl(var(--primary))"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}