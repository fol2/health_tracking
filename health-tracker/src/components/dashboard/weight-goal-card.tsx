'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Target, TrendingDown, TrendingUp, Calendar, AlertCircle, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useUserProfile } from '@/hooks/use-user-profile'

interface WeightGoalData {
  currentWeight: number | null
  targetWeight: number | null
  weeklyTrend: number | null
  monthlyTrend: number | null
}

export function WeightGoalCard() {
  const { toast } = useToast()
  const { profile } = useUserProfile()
  const [goalData, setGoalData] = useState<WeightGoalData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [weightHistory, setWeightHistory] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        
        // Fetch latest weight
        const latestRes = await fetch('/api/health/latest')
        const latest = latestRes.ok ? await latestRes.json() : null
        
        // Fetch weight history for trend calculation
        const historyRes = await fetch('/api/health/weight?limit=30')
        const historyData = historyRes.ok ? await historyRes.json() : { records: [] }
        const history = historyData.records || []
        setWeightHistory(history) // Store history for later use
        
        // Calculate trends - Simple calculation using first and last records
        let weeklyTrend: number | null = null
        let monthlyTrend: number | null = null
        
        if (history.length >= 2) {
          // Sort by date ascending to get oldest first
          const sorted = history.sort((a: any, b: any) => 
            new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
          )
          
          // Get first (oldest) and last (newest) records
          const initialWeight = sorted[0]
          const currentWeight = sorted[sorted.length - 1]
          
          // Calculate days between first and last record
          const daysDiff = Math.max(1,
            (new Date(currentWeight.recordedAt).getTime() - new Date(initialWeight.recordedAt).getTime()) 
            / (1000 * 60 * 60 * 24)
          )
          
          // Simple calculation: total change divided by time period
          const totalChange = Number(currentWeight.weight) - Number(initialWeight.weight)
          
          // Calculate weekly and monthly rates
          weeklyTrend = (totalChange / daysDiff) * 7
          monthlyTrend = (totalChange / daysDiff) * 30
        }
        
        setGoalData({
          currentWeight: latest?.weight ? Number(latest.weight.weight) : null,
          targetWeight: profile?.targetWeight ? Number(profile.targetWeight) : null,
          weeklyTrend,
          monthlyTrend
        })
      } catch (error) {
        console.error('Failed to fetch weight goal data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [profile])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading weight goal...</div>
        </CardContent>
      </Card>
    )
  }

  if (!goalData || !goalData.currentWeight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weight Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              No weight data available
            </p>
            <Link href="/health">
              <Button size="sm">Log Weight</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!goalData.targetWeight) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Weight Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              Set your target weight to track progress
            </p>
            <Link href="/profile">
              <Button size="sm">Set Target</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate progress and time to goal
  const weightDifference = goalData.currentWeight - goalData.targetWeight
  const isLosing = weightDifference > 0 // Need to lose weight
  const targetDifference = Math.abs(weightDifference)
  
  // Use the appropriate trend (weekly or monthly, whichever is more reliable)
  const trend = goalData.weeklyTrend !== null ? goalData.weeklyTrend : 
                 goalData.monthlyTrend !== null ? goalData.monthlyTrend / 4.33 : null
  
  let timeToGoal: number | null = null
  let timeUnit = ''
  let trendDirection = ''
  
  if (trend !== null && Math.abs(trend) > 0.0001) { // Show trend even for small changes
    const weeklyProgress = Math.abs(trend)
    const weeksNeeded = targetDifference / weeklyProgress
    
    if (weeksNeeded < 8) {
      timeToGoal = Math.ceil(weeksNeeded)
      timeUnit = timeToGoal === 1 ? 'week' : 'weeks'
    } else if (weeksNeeded < 52) {
      timeToGoal = Math.ceil(weeksNeeded / 4.33)
      timeUnit = timeToGoal === 1 ? 'month' : 'months'
    } else {
      timeToGoal = Math.round(weeksNeeded / 52 * 10) / 10
      timeUnit = timeToGoal === 1 ? 'year' : 'years'
    }
    
    // Check if trend is in the right direction
    if (isLosing && trend > 0) {
      trendDirection = 'wrong' // Gaining when should be losing
    } else if (!isLosing && trend < 0) {
      trendDirection = 'wrong' // Losing when should be gaining
    } else {
      trendDirection = 'right'
    }
  }
  
  // Calculate progress percentage based on initial weight from history
  let progress = 0
  if (weightHistory.length >= 1 && goalData.targetWeight) {
    // Get the initial (oldest) weight from history
    const sorted = weightHistory.sort((a: any, b: any) => 
      new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    )
    const initialWeight = Number(sorted[0].weight)
    
    // Calculate progress from initial to current towards target
    const totalDistance = Math.abs(initialWeight - goalData.targetWeight)
    const progressMade = Math.abs(initialWeight - goalData.currentWeight)
    
    progress = Math.max(0, Math.min(100, (progressMade / totalDistance) * 100))
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Weight Goal
        </CardTitle>
        <Link href="/profile">
          <Button variant="ghost" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Current</span>
            <span className="text-lg font-bold">{goalData.currentWeight.toFixed(1)} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Target</span>
            <span className="text-lg font-bold text-primary">{goalData.targetWeight.toFixed(1)} kg</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">To {isLosing ? 'Lose' : 'Gain'}</span>
            <span className="text-lg font-bold">{targetDifference.toFixed(1)} kg</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {trend !== null && Math.abs(trend) > 0.0001 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {trend < 0 ? (
                  <TrendingDown className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm font-medium">
                  {Math.abs(trend).toFixed(2)} kg/week
                </span>
              </div>
            </div>

            {trendDirection === 'right' && timeToGoal !== null ? (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">
                    Estimated Time to Goal
                  </span>
                </div>
                <p className="text-lg font-bold text-green-900 dark:text-green-100">
                  {timeToGoal} {timeUnit}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  At current rate of {Math.abs(trend).toFixed(2)} kg/week
                </p>
              </div>
            ) : trendDirection === 'wrong' ? (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Wrong Direction
                  </span>
                </div>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  You're {trend > 0 ? 'gaining' : 'losing'} weight but need to {isLosing ? 'lose' : 'gain'}.
                  Consider adjusting your diet and exercise routine.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Insufficient Data
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Log your weight regularly to see time estimates and trends
            </p>
          </div>
        )}

        <div className="pt-2 border-t">
          <Link href="/health">
            <Button variant="outline" size="sm" className="w-full">
              Update Weight
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}