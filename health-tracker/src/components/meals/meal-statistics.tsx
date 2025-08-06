'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { Bar, BarChart, Line, LineChart, Pie, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts'

interface NutritionStats {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
  averageCaloriesPerDay: number
  averageProteinPerDay: number
  averageCarbsPerDay: number
  averageFatPerDay: number
}

interface DailyBreakdown {
  date: string
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  mealCount: number
  mealTypes: {
    breakfast: number
    lunch: number
    dinner: number
    snack: number
  }
}

interface TopFood {
  name: string
  brand?: string
  usage_count: number
  total_calories: number
}

interface StatisticsData {
  summary: NutritionStats & {
    period: string
    startDate: string
    endDate: string
    totalMeals: number
    dailyBreakdown: DailyBreakdown[]
  }
  topFoods: TopFood[]
}

const CHART_COLORS = {
  calories: '#8884d8',
  protein: '#82ca9d',
  carbs: '#ffc658',
  fat: '#ff7c7c',
  fiber: '#8dd1e1'
}

const MEAL_TYPE_COLORS = {
  breakfast: '#fbbf24',
  lunch: '#3b82f6',
  dinner: '#8b5cf6',
  snack: '#10b981'
}

export function MealStatistics() {
  const { toast } = useToast()
  const [period, setPeriod] = useState<'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<StatisticsData | null>(null)

  useEffect(() => {
    const fetchStatistics = async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/meals/statistics?period=${period}&date=${currentDate.toISOString()}`
        )
        
        if (!response.ok) throw new Error('Failed to fetch statistics')
        
        const statsData = await response.json()
        setData(statsData)
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load meal statistics',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatistics()
  }, [period, currentDate]) // Remove toast from dependencies

  const handlePrevious = () => {
    if (period === 'week') {
      setCurrentDate(prev => subWeeks(prev, 1))
    } else {
      setCurrentDate(prev => subMonths(prev, 1))
    }
  }

  const handleNext = () => {
    if (period === 'week') {
      setCurrentDate(prev => addWeeks(prev, 1))
    } else {
      setCurrentDate(prev => addMonths(prev, 1))
    }
  }

  const formatDateRange = () => {
    if (period === 'week') {
      const start = startOfWeek(currentDate, { weekStartsOn: 1 })
      const end = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
    } else {
      return format(currentDate, 'MMMM yyyy')
    }
  }

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading statistics...
          </div>
        </CardContent>
      </Card>
    )
  }

  const macroDistribution = [
    { name: 'Protein', value: data.summary.totalProtein, color: CHART_COLORS.protein },
    { name: 'Carbs', value: data.summary.totalCarbs, color: CHART_COLORS.carbs },
    { name: 'Fat', value: data.summary.totalFat, color: CHART_COLORS.fat }
  ]

  const dailyCaloriesData = data.summary.dailyBreakdown.map(day => ({
    date: format(new Date(day.date), 'MMM d'),
    calories: day.totalCalories,
    protein: day.totalProtein,
    carbs: day.totalCarbs,
    fat: day.totalFat
  }))

  const mealTypeDistribution = Object.entries(
    data.summary.dailyBreakdown.reduce((acc, day) => {
      Object.entries(day.mealTypes).forEach(([type, count]) => {
        acc[type] = (acc[type] || 0) + count
      })
      return acc
    }, {} as Record<string, number>)
  ).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    color: MEAL_TYPE_COLORS[type as keyof typeof MEAL_TYPE_COLORS]
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Meal Statistics</h2>
          <Select value={period} onValueChange={(value: 'week' | 'month') => setPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="month">Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={handlePrevious}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[200px] text-center font-medium">
            {formatDateRange()}
          </div>
          <Button size="icon" variant="outline" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Calories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalCalories.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              Avg: {data.summary.averageCaloriesPerDay}/day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Protein</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(data.summary.totalProtein)}g</div>
            <div className="text-sm text-muted-foreground">
              Avg: {data.summary.averageProteinPerDay}g/day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.totalMeals}</div>
            <div className="text-sm text-muted-foreground">
              Avg: {(data.summary.totalMeals / (data.summary.dailyBreakdown.length || 1)).toFixed(1)}/day
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Active Days</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.dailyBreakdown.length}</div>
            <div className="text-sm text-muted-foreground">
              Days with logged meals
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="calories" className="w-full">
        <TabsList>
          <TabsTrigger value="calories">Calorie Trends</TabsTrigger>
          <TabsTrigger value="macros">Macro Distribution</TabsTrigger>
          <TabsTrigger value="meals">Meal Types</TabsTrigger>
          <TabsTrigger value="foods">Top Foods</TabsTrigger>
        </TabsList>

        <TabsContent value="calories">
          <Card>
            <CardHeader>
              <CardTitle>Daily Calorie Intake</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyCaloriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="calories" 
                    stroke={CHART_COLORS.calories} 
                    strokeWidth={2}
                    name="Calories"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="macros">
          <Card>
            <CardHeader>
              <CardTitle>Macronutrient Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={macroDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {macroDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>

                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dailyCaloriesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="protein" stackId="a" fill={CHART_COLORS.protein} name="Protein (g)" />
                    <Bar dataKey="carbs" stackId="a" fill={CHART_COLORS.carbs} name="Carbs (g)" />
                    <Bar dataKey="fat" stackId="a" fill={CHART_COLORS.fat} name="Fat (g)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="meals">
          <Card>
            <CardHeader>
              <CardTitle>Meal Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mealTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {mealTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foods">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Most Consumed Foods</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {data.topFoods.map((food, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div className="flex-1">
                      <div className="font-medium">{food.name}</div>
                      {food.brand && (
                        <div className="text-sm text-muted-foreground">{food.brand}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{food.usage_count}x</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(food.total_calories)} cal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}