'use client'

import { useEffect, useState, useMemo } from 'react'
import { Card } from '@/components/ui/card'
import { useHealthMetricsStore } from '@/store/health-metrics-store'
import { useUserProfileStore } from '@/store/user-profile-store'
import { 
  calculateBMI,
  formatWeight,
  WeightUnits,
  convertWeight
} from '@/lib/utils/health-calculations'
import { Loader2, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts'
import { format } from 'date-fns'

// Type definitions
type DayOption = 7 | 30 | 90 | 365

interface BMITrendChartProps {
  days?: DayOption
}

// BMI categories with ranges and colors
const BMI_CATEGORIES = [
  { name: 'Underweight', min: 0, max: 18.5, color: '#60a5fa' },
  { name: 'Normal', min: 18.5, max: 25, color: '#34d399' },
  { name: 'Overweight', min: 25, max: 30, color: '#fbbf24' },
  { name: 'Obese', min: 30, max: Infinity, color: '#f87171' },
] as const

// Chart configuration constants
const CHART_CONFIG = {
  minDomain: 15,
  maxDomain: 40,
  healthyBmiLower: 18.5,
  healthyBmiUpper: 25,
  barRadius: [8, 8, 0, 0] as [number, number, number, number]
} as const

// Helper functions
const getBMICategory = (bmi: number) => {
  return BMI_CATEGORIES.find(cat => bmi >= cat.min && bmi < cat.max) || BMI_CATEGORIES[3]
}

const formatBMIValue = (value: number) => value.toFixed(1)

// Reference line configuration helper
const createReferenceLine = (y: number, stroke: string, label: string | number, labelClass: string) => ({
  y,
  stroke,
  strokeDasharray: "5 5",
  opacity: 0.7,
  label: { value: String(label), position: "left" as const, className: `text-xs ${labelClass}` }
})

interface ChartDataPoint {
  date: string
  fullDate: string
  bmi: number
  weight: number
  displayWeight: number
  category: string
  color: string
  notes?: string
}

interface BMIStats {
  current: number
  start: number
  average: number
  change: number
  min: number
  max: number
}

// Custom components
const LoadingState = () => (
  <Card className="p-6">
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  </Card>
)

const EmptyState = ({ message, icon = false }: { message: string; icon?: boolean }) => (
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4">BMI Trend</h3>
    <div className="text-center py-8">
      {icon && <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4" />}
      <p className="text-muted-foreground">{message}</p>
    </div>
  </Card>
)

interface DaySelectorProps {
  value: DayOption
  onChange: (days: DayOption) => void
}

const DaySelector = ({ value, onChange }: DaySelectorProps) => (
  <select
    value={value}
    onChange={(e) => onChange(Number(e.target.value) as DayOption)}
    className="text-sm border rounded-md px-2 py-1 bg-background"
  >
    <option value={7}>Last 7 days</option>
    <option value={30}>Last 30 days</option>
    <option value={90}>Last 90 days</option>
    <option value={365}>Last year</option>
  </select>
)

// Custom tooltip component with proper typing for recharts v3
interface BMITooltipProps {
  active?: boolean
  payload?: Array<{
    value: number
    payload: ChartDataPoint
  }>
  label?: string | number
}

const BMITooltip: React.FC<BMITooltipProps> = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  
  const { fullDate, bmi, category, color, displayWeight, weight, notes } = payload[0].payload
  const unit = weight !== displayWeight ? WeightUnits.LBS : WeightUnits.KG
  
  return (
    <div className="bg-background border rounded-lg shadow-lg p-3 space-y-1">
      <p className="font-semibold">{fullDate}</p>
      <p className="text-sm">BMI: <span className="font-medium">{bmi}</span></p>
      <p className="text-sm font-medium" style={{ color }}>{category}</p>
      <p className="text-sm text-muted-foreground">
        Weight: {formatWeight(displayWeight, unit)}
      </p>
      {notes && <p className="text-xs text-muted-foreground mt-1">{notes}</p>}
    </div>
  )
}

const BMILegend = () => (
  <div className="mt-4 flex flex-wrap gap-3 text-xs">
    {BMI_CATEGORIES.map((cat) => (
      <div key={cat.name} className="flex items-center gap-1">
        <div 
          className="w-3 h-3 rounded-sm" 
          style={{ backgroundColor: cat.color }}
        />
        <span className="text-muted-foreground">
          {cat.name} ({cat.min}-{cat.max === Infinity ? '30+' : cat.max})
        </span>
      </div>
    ))}
  </div>
)

const BMIStatistics = ({ stats }: { stats: BMIStats }) => {
  const currentCategory = getBMICategory(stats.current)
  const changeColor = stats.change > 0 ? "text-red-500" : stats.change < 0 ? "text-green-500" : ""
  
  const statItems = [
    { label: "Start BMI", value: formatBMIValue(stats.start) },
    { 
      label: "Current BMI", 
      value: formatBMIValue(stats.current),
      suffix: <span className="text-xs ml-1" style={{ color: currentCategory.color }}>
        ({currentCategory.name})
      </span>
    },
    { 
      label: "Change", 
      value: `${stats.change > 0 ? "+" : ""}${formatBMIValue(stats.change)}`,
      className: changeColor
    },
    { label: "Average", value: formatBMIValue(stats.average) }
  ]

  return (
    <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
      {statItems.map(({ label, value, suffix, className }) => (
        <div key={label}>
          <p className="text-muted-foreground">{label}</p>
          <p className={cn("font-semibold", className)}>
            {value}{suffix}
          </p>
        </div>
      ))}
    </div>
  )
}

export function BMITrendChart({ days = 30 }: BMITrendChartProps) {
  const { weightHistory, fetchWeightHistory } = useHealthMetricsStore()
  const { profile, fetchProfile } = useUserProfileStore()
  
  const [selectedDays, setSelectedDays] = useState(days)
  const [isLoading, setIsLoading] = useState(true)
  
  const unit = profile?.unitsPreference === 'imperial' ? WeightUnits.LBS : WeightUnits.KG

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Parallel fetch for better performance
        await Promise.all([
          !profile && fetchProfile(),
          fetchWeightHistory(selectedDays === 365 ? 100 : selectedDays)
        ].filter(Boolean))
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [selectedDays, fetchWeightHistory, fetchProfile, profile])

  // Transform weight history to chart data
  const chartData = useMemo(() => {
    if (!profile?.height) return []
    
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - selectedDays)
    
    return weightHistory
      .filter(record => new Date(record.recordedAt) >= cutoffDate)
      .reverse()
      .map(record => {
        const bmi = calculateBMI(record.weight, profile.height!)
        const category = getBMICategory(bmi)
        const recordDate = new Date(record.recordedAt)
        
        return {
          date: format(recordDate, 'MMM dd'),
          fullDate: recordDate.toLocaleDateString('en-GB'),
          bmi: parseFloat(formatBMIValue(bmi)),
          weight: record.weight,
          displayWeight: unit === WeightUnits.KG 
            ? record.weight 
            : convertWeight(record.weight, WeightUnits.KG, unit),
          category: category.name,
          color: category.color,
          notes: record.notes,
        }
      })
  }, [weightHistory, profile?.height, selectedDays, unit])

  // Calculate statistics
  const stats = useMemo<BMIStats | null>(() => {
    if (chartData.length === 0) return null
    
    const bmis = chartData.map(d => d.bmi)
    const [start, ...rest] = bmis
    const current = bmis.at(-1)!
    
    return {
      current,
      start,
      average: bmis.reduce((a, b) => a + b, 0) / bmis.length,
      change: current - start,
      min: Math.min(...bmis),
      max: Math.max(...bmis),
    }
  }, [chartData])

  // Early returns for different states
  if (isLoading) return <LoadingState />
  
  if (!profile?.height) {
    return <EmptyState message="Please set your height in your profile to see BMI trends" icon />
  }
  
  if (chartData.length === 0) {
    return <EmptyState message="No weight data for the selected period" />
  }

  const chartDomain = [
    Math.max(CHART_CONFIG.minDomain, stats!.min - 1), 
    Math.min(CHART_CONFIG.maxDomain, stats!.max + 1)
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">BMI Trend</h3>
        <DaySelector value={selectedDays} onChange={setSelectedDays} />
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'currentColor' }}
              domain={chartDomain}
            />
            <Tooltip content={BMITooltip as any} />
            
            <ReferenceLine 
              y={stats!.average} 
              stroke="#6b7280" 
              strokeDasharray="3 3"
              label={{ value: "Avg", position: "right", className: "text-xs fill-muted-foreground" }}
            />
            
            <ReferenceLine 
              {...createReferenceLine(CHART_CONFIG.healthyBmiLower, "#10b981", CHART_CONFIG.healthyBmiLower, "fill-green-500")}
            />
            <ReferenceLine 
              {...createReferenceLine(CHART_CONFIG.healthyBmiUpper, "#10b981", CHART_CONFIG.healthyBmiUpper, "fill-green-500")}
            />
            
            <Bar dataKey="bmi" radius={CHART_CONFIG.barRadius}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <BMILegend />
      {stats && <BMIStatistics stats={stats} />}
    </Card>
  )
}