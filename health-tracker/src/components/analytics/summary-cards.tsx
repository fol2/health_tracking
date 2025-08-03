'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Award, 
  Clock, 
  Heart,
  Scale,
  Activity
} from 'lucide-react'

interface SummaryCardsProps {
  startDate: Date
  endDate: Date
}

interface SummaryData {
  weightProgress: {
    current: number
    target: number
    change: number
    changePercent: number
    trend: 'up' | 'down' | 'stable'
  }
  fastingStats: {
    totalHours: number
    averageDuration: number
    completionRate: number
    currentStreak: number
  }
  healthMetrics: {
    avgHeartRate: number
    avgBloodPressure: { systolic: number; diastolic: number }
    avgSleepHours: number
    avgEnergyLevel: number
  }
  achievements: {
    title: string
    description: string
    icon: string
    achieved: boolean
  }[]
}

export function SummaryCards({ startDate, endDate }: SummaryCardsProps) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [previousPeriodData, setPreviousPeriodData] = useState<any>(null)

  useEffect(() => {
    const fetchSummaryData = async () => {
      try {
        const currentParams = new URLSearchParams({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        const previousParams = new URLSearchParams({
          startDate: new Date(startDate.getTime() - (endDate.getTime() - startDate.getTime())).toISOString(),
          endDate: startDate.toISOString(),
        })

        const [currentResponse, previousResponse] = await Promise.all([
          fetch(`/api/analytics/summary?${currentParams}`),
          fetch(`/api/analytics/summary?${previousParams}`),
        ])

        if (!currentResponse.ok || !previousResponse.ok) {
          throw new Error('Failed to fetch summary data')
        }

        const currentResult = await currentResponse.json()
        const previousResult = await previousResponse.json()

        if (currentResult) {
          setData(currentResult)
        }
        if (previousResult) {
          setPreviousPeriodData(previousResult)
        }
      } catch (error) {
        console.error('Failed to fetch summary data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummaryData()
  }, [startDate, endDate])

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
    )
  }

  if (!data) {
    return null
  }

  const calculateComparison = (current: number, previous: number) => {
    if (!previous) return { change: 0, trend: 'stable' as const }
    const change = ((current - previous) / previous) * 100
    return {
      change: Math.abs(change),
      trend: change > 0 ? 'up' : change < 0 ? 'down' : 'stable' as 'up' | 'down' | 'stable'
    }
  }

  const weightComparison = previousPeriodData 
    ? calculateComparison(data.weightProgress.change, previousPeriodData.weightProgress.change)
    : null

  const fastingComparison = previousPeriodData
    ? calculateComparison(data.fastingStats.totalHours, previousPeriodData.fastingStats.totalHours)
    : null

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Weight Progress Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weight Progress</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.weightProgress.current.toFixed(1)} kg
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {data.weightProgress.trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-green-500" />
            ) : data.weightProgress.trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-red-500" />
            ) : (
              <Activity className="h-3 w-3 text-yellow-500" />
            )}
            <span>
              {Math.abs(data.weightProgress.change).toFixed(1)} kg (
              {Math.abs(data.weightProgress.changePercent).toFixed(1)}%)
            </span>
          </div>
          {data.weightProgress.target && (
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs">
                <span>Target: {data.weightProgress.target.toFixed(1)} kg</span>
                <span>
                  {Math.abs(data.weightProgress.current - data.weightProgress.target).toFixed(1)} kg to go
                </span>
              </div>
              <Progress 
                value={
                  100 - (Math.abs(data.weightProgress.current - data.weightProgress.target) / 
                  data.weightProgress.target * 100)
                } 
                className="h-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fasting Stats Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Fasting Progress</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {data.fastingStats.totalHours.toFixed(0)} hours
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {fastingComparison && (
              <>
                {fastingComparison.trend === 'up' ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : fastingComparison.trend === 'down' ? (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                ) : (
                  <Activity className="h-3 w-3 text-yellow-500" />
                )}
                <span>{fastingComparison.change.toFixed(0)}% vs previous period</span>
              </>
            )}
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Avg Duration: </span>
              <span className="font-medium">{data.fastingStats.averageDuration.toFixed(1)}h</span>
            </div>
            <div>
              <span className="text-muted-foreground">Completion: </span>
              <span className="font-medium">{data.fastingStats.completionRate.toFixed(0)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Metrics Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Health Metrics</CardTitle>
          <Heart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Heart Rate</span>
              <span className="font-medium">{data.healthMetrics.avgHeartRate} bpm</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Blood Pressure</span>
              <span className="font-medium">
                {data.healthMetrics.avgBloodPressure.systolic}/{data.healthMetrics.avgBloodPressure.diastolic}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sleep</span>
              <span className="font-medium">{data.healthMetrics.avgSleepHours.toFixed(1)}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Energy</span>
              <span className="font-medium">{data.healthMetrics.avgEnergyLevel.toFixed(1)}/10</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Recent Achievements</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {data.achievements.slice(0, 3).map((achievement, index) => (
              <div key={index} className="flex items-start gap-2">
                <div className={`mt-0.5 h-2 w-2 rounded-full ${
                  achievement.achieved ? 'bg-green-500' : 'bg-muted'
                }`} />
                <div className="flex-1 space-y-0.5">
                  <p className="text-sm font-medium leading-none">
                    {achievement.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {achievement.description}
                  </p>
                </div>
              </div>
            ))}
            {data.achievements.length > 3 && (
              <p className="text-xs text-muted-foreground">
                +{data.achievements.length - 3} more achievements
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}