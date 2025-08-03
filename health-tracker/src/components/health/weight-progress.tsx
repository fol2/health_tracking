'use client'

import { useEffect, useState } from 'react'
import { Target, TrendingUp, TrendingDown, Activity, Calendar } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useHealthMetricsStore } from '@/store/health-metrics-store'
import { useUserProfileStore } from '@/store/user-profile-store'
import { 
  convertWeight, 
  WeightUnits, 
  type WeightUnit,
  formatWeight,
  calculateBMI,
  getBMICategory,
  calculateWeightChange
} from '@/lib/utils/health-calculations'
import { cn } from '@/lib/utils'

export function WeightProgress() {
  const { recentWeight, weightHistory, fetchWeightHistory } = useHealthMetricsStore()
  const { profile } = useUserProfileStore()
  
  const [unit, setUnit] = useState<WeightUnit>(
    profile?.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG
  )

  useEffect(() => {
    if (!weightHistory.length) {
      fetchWeightHistory(30)
    }
  }, [weightHistory.length, fetchWeightHistory])

  useEffect(() => {
    if (profile?.unitsPreference) {
      setUnit(profile.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG)
    }
  }, [profile?.unitsPreference])

  // Calculate weight changes
  const getWeightChanges = () => {
    if (!recentWeight || weightHistory.length < 2) {
      return { week: null, month: null }
    }

    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Find closest weight records to compare
    const weekRecord = weightHistory.find(r => 
      new Date(r.recordedAt) <= weekAgo
    )
    const monthRecord = weightHistory.find(r => 
      new Date(r.recordedAt) <= monthAgo
    )

    return {
      week: weekRecord ? calculateWeightChange(recentWeight.weight, weekRecord.weight) : null,
      month: monthRecord ? calculateWeightChange(recentWeight.weight, monthRecord.weight) : null,
    }
  }

  // Calculate progress to target
  const getProgressToTarget = () => {
    if (!recentWeight || !profile?.targetWeight) return null

    const current = recentWeight.weight
    const target = profile.targetWeight
    const progress = ((current - target) / current) * 100

    return {
      percentage: Math.abs(progress),
      toGo: Math.abs(current - target),
      direction: current > target ? 'lose' : 'gain',
    }
  }

  // Calculate BMI
  const getBMI = () => {
    if (!recentWeight || !profile?.height) return null

    const bmi = calculateBMI(recentWeight.weight, profile.height)
    return {
      value: bmi,
      ...getBMICategory(bmi),
    }
  }

  const changes = getWeightChanges()
  const progress = getProgressToTarget()
  const bmi = getBMI()

  const displayWeight = recentWeight
    ? unit === WeightUnits.KG 
      ? recentWeight.weight 
      : convertWeight(recentWeight.weight, WeightUnits.KG, unit)
    : null

  if (!recentWeight) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No weight data available. Record your first weight!
        </div>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Current Weight Card */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Current Weight</h3>
        </div>
        <div className="text-3xl font-bold">
          {displayWeight && formatWeight(displayWeight, unit)}
        </div>
        <div className="text-sm text-muted-foreground mt-1">
          <Calendar className="h-3 w-3 inline mr-1" />
          {new Date(recentWeight.recordedAt).toLocaleDateString('en-GB')}
        </div>
      </Card>

      {/* Progress to Target Card */}
      {progress && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Target Progress</h3>
          </div>
          <div className="space-y-2">
            <div className="text-2xl font-bold">
              {formatWeight(convertWeight(progress.toGo, WeightUnits.KG, unit), unit)} to {progress.direction}
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <div className="text-sm text-muted-foreground">
              Target: {formatWeight(
                convertWeight(profile?.targetWeight ?? 0, WeightUnits.KG, unit), 
                unit
              )}
            </div>
          </div>
        </Card>
      )}

      {/* BMI Card */}
      {bmi && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">BMI</h3>
          </div>
          <div className="text-3xl font-bold">
            {bmi.value.toFixed(1)}
          </div>
          <div className={cn("text-sm font-medium mt-1", bmi.color)}>
            {bmi.category}
          </div>
        </Card>
      )}

      {/* Weight Changes Card */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Changes</h3>
        </div>
        <div className="space-y-2">
          {changes.week ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Week</span>
              <div className="flex items-center gap-1">
                {changes.week.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : changes.week.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : null}
                <span className={cn(
                  "text-sm font-medium",
                  changes.week.direction === 'up' ? 'text-red-500' : 'text-green-500'
                )}>
                  {changes.week.direction !== 'same' && (
                    <>
                      {changes.week.direction === 'up' ? '+' : '-'}
                      {formatWeight(convertWeight(changes.week.absolute, WeightUnits.KG, unit), unit, 1)}
                    </>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Week: No data
            </div>
          )}

          {changes.month ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Month</span>
              <div className="flex items-center gap-1">
                {changes.month.direction === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-red-500" />
                ) : changes.month.direction === 'down' ? (
                  <TrendingDown className="h-4 w-4 text-green-500" />
                ) : null}
                <span className={cn(
                  "text-sm font-medium",
                  changes.month.direction === 'up' ? 'text-red-500' : 'text-green-500'
                )}>
                  {changes.month.direction !== 'same' && (
                    <>
                      {changes.month.direction === 'up' ? '+' : '-'}
                      {formatWeight(convertWeight(changes.month.absolute, WeightUnits.KG, unit), unit, 1)}
                    </>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Month: No data
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}