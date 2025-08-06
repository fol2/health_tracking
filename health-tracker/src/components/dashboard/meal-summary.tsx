'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Utensils, TrendingUp, TrendingDown, Target, Info, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NutritionSummary {
  todayCalories: number
  todayProtein: number
  todayCarbs: number
  todayFat: number
  todayMeals: number
  weekAvgCalories: number
  calorieGoal: number
  proteinGoal: number
}

interface MealRecommendation {
  type: 'info' | 'warning' | 'success'
  message: string
}

export function MealSummary() {
  const { toast } = useToast()
  const [summary, setSummary] = useState<NutritionSummary | null>(null)
  const [recommendations, setRecommendations] = useState<MealRecommendation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch today's meal summary
        const today = new Date().toISOString().split('T')[0]
        const summaryRes = await fetch(`/api/meals/statistics?period=day&date=${today}`)
        
        if (summaryRes.ok) {
          const data = await summaryRes.json()
          
          // Calculate summary
          const todayData = data.summary.dailyBreakdown?.[0] || {}
          const nutritionSummary: NutritionSummary = {
            todayCalories: todayData.totalCalories || 0,
            todayProtein: todayData.totalProtein || 0,
            todayCarbs: todayData.totalCarbs || 0,
            todayFat: todayData.totalFat || 0,
            todayMeals: todayData.mealCount || 0,
            weekAvgCalories: data.summary.averageCaloriesPerDay || 0,
            calorieGoal: 2000, // Default goal, should come from user profile
            proteinGoal: 50 // Default goal
          }
          
          setSummary(nutritionSummary)
          
          // Generate recommendations
          const recs: MealRecommendation[] = []
          
          if (nutritionSummary.todayCalories < nutritionSummary.calorieGoal * 0.5) {
            recs.push({
              type: 'warning',
              message: `You've only consumed ${nutritionSummary.todayCalories} calories today. Consider having a nutritious meal.`
            })
          }
          
          if (nutritionSummary.todayProtein < nutritionSummary.proteinGoal * 0.5) {
            recs.push({
              type: 'info',
              message: 'Your protein intake is low today. Consider adding lean meats, fish, or legumes to your next meal.'
            })
          }
          
          if (nutritionSummary.todayMeals === 0) {
            recs.push({
              type: 'info',
              message: "You haven't logged any meals today. Start tracking for better health insights!"
            })
          }
          
          if (nutritionSummary.todayCalories > nutritionSummary.calorieGoal) {
            recs.push({
              type: 'warning',
              message: `You've exceeded your daily calorie goal by ${nutritionSummary.todayCalories - nutritionSummary.calorieGoal} calories.`
            })
          }
          
          setRecommendations(recs)
        }
      } catch (error) {
        console.error('Failed to fetch meal summary:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading meal data...</div>
        </CardContent>
      </Card>
    )
  }

  if (!summary) {
    return null
  }

  const calorieProgress = Math.min((summary.todayCalories / summary.calorieGoal) * 100, 100)
  const proteinProgress = Math.min((summary.todayProtein / summary.proteinGoal) * 100, 100)

  return (
    <div className="space-y-4">
      {/* Today's Nutrition Summary */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Utensils className="h-5 w-5" />
            Today's Nutrition
          </CardTitle>
          <Link href="/meals">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Log Meal
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          {summary.todayMeals === 0 ? (
            <div className="text-center py-6">
              <Utensils className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-4">
                No meals logged today yet
              </p>
              <Link href="/meals">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Log Your First Meal
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold">{summary.todayCalories}</div>
                  <div className="text-sm text-muted-foreground">Calories</div>
                  <Progress value={calorieProgress} className="mt-2 h-2" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary.todayMeals}</div>
                  <div className="text-sm text-muted-foreground">Meals Logged</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-2 border-t">
                <div>
                  <div className="font-semibold">{Math.round(summary.todayProtein)}g</div>
                  <div className="text-xs text-muted-foreground">Protein</div>
                </div>
                <div>
                  <div className="font-semibold">{Math.round(summary.todayCarbs)}g</div>
                  <div className="text-xs text-muted-foreground">Carbs</div>
                </div>
                <div>
                  <div className="font-semibold">{Math.round(summary.todayFat)}g</div>
                  <div className="text-xs text-muted-foreground">Fat</div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Week Average</span>
                <span className="font-medium">{Math.round(summary.weekAvgCalories)} cal/day</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {recommendations.map((rec, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  rec.type === 'warning' 
                    ? 'bg-orange-50 dark:bg-orange-950/20' 
                    : rec.type === 'success'
                    ? 'bg-green-50 dark:bg-green-950/20'
                    : 'bg-blue-50 dark:bg-blue-950/20'
                }`}
              >
                <Info className={`h-4 w-4 mt-0.5 ${
                  rec.type === 'warning' 
                    ? 'text-orange-600' 
                    : rec.type === 'success'
                    ? 'text-green-600'
                    : 'text-blue-600'
                }`} />
                <span className="text-sm">{rec.message}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}