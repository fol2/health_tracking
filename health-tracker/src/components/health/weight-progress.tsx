'use client'

import { useEffect, useState, useMemo } from 'react'
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

  // Helper function to find record before or at a specific date
  const findRecordBeforeDate = (targetDate: Date, allowEqual = true) => {
    return weightHistory.find(r => {
      const recordDate = new Date(r.recordedAt)
      return allowEqual ? recordDate <= targetDate : recordDate < targetDate
    })
  }

  // Helper function to get date boundaries
  const getDateBoundaries = () => {
    const now = new Date()
    
    // Day ago
    const dayAgo = new Date(now)
    dayAgo.setDate(dayAgo.getDate() - 1)
    
    // Start of current week (configurable, defaulting to Sunday)
    const weekStart = new Date(now)
    const daysToSubtract = now.getDay() // 0 = Sunday
    weekStart.setDate(now.getDate() - daysToSubtract)
    weekStart.setHours(0, 0, 0, 0)
    
    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    monthStart.setHours(0, 0, 0, 0)
    
    return { dayAgo, weekStart, monthStart }
  }

  // Calculate weight changes with memoization
  const getWeightChanges = () => {
    if (!recentWeight || weightHistory.length < 2) {
      return { day: null, wtd: null, mtd: null }
    }

    const { dayAgo, weekStart, monthStart } = getDateBoundaries()
    
    // Find comparison records
    const dayRecord = findRecordBeforeDate(dayAgo)
    const wtdRecord = findRecordBeforeDate(weekStart, false) || findRecordBeforeDate(weekStart)
    const mtdRecord = findRecordBeforeDate(monthStart, false) || findRecordBeforeDate(monthStart)

    // Calculate changes
    const calculateChange = (record: typeof dayRecord) => 
      record ? calculateWeightChange(recentWeight.weight, record.weight) : null

    return {
      day: calculateChange(dayRecord),
      wtd: calculateChange(wtdRecord),
      mtd: calculateChange(mtdRecord),
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

  // Memoize expensive calculations
  const changes = useMemo(() => getWeightChanges(), [recentWeight, weightHistory])
  const progress = useMemo(() => getProgressToTarget(), [recentWeight, profile?.targetWeight])
  const bmi = useMemo(() => getBMI(), [recentWeight, profile?.height])

  const displayWeight = useMemo(() => 
    recentWeight
      ? unit === WeightUnits.KG 
        ? recentWeight.weight 
        : convertWeight(recentWeight.weight, WeightUnits.KG, unit)
      : null,
    [recentWeight, unit]
  )

  // Reusable component for rendering weight change
  const renderWeightChange = (label: string, change: ReturnType<typeof calculateWeightChange> | null) => {
    if (!change) {
      return (
        <div className="text-sm text-muted-foreground">
          {label}: No data
        </div>
      )
    }

    if (change.direction === 'same') {
      return (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          <span className="text-sm text-muted-foreground">No change</span>
        </div>
      )
    }

    const isGain = change.direction === 'up'
    const Icon = isGain ? TrendingUp : TrendingDown
    const colorClass = isGain ? 'text-red-500' : 'text-green-500'
    const sign = isGain ? '+' : '-'
    const weightValue = formatWeight(
      convertWeight(change.absolute, WeightUnits.KG, unit), 
      unit, 
      1
    )

    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-1">
          <Icon className={cn("h-4 w-4", colorClass)} />
          <span className={cn("text-sm font-medium", colorClass)}>
            {sign}{weightValue}
          </span>
        </div>
      </div>
    )
  }

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
          {renderWeightChange('Day', changes.day)}
          {renderWeightChange('WTD', changes.wtd)}
          {renderWeightChange('MTD', changes.mtd)}
        </div>
      </Card>
    </div>
  )
}