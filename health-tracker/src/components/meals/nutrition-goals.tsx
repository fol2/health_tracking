'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Target, TrendingUp, Edit2, Save, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface NutritionGoal {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  water: number // in ml
  enabled: boolean
}

interface DailyProgress {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
}

export function NutritionGoals() {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [goals, setGoals] = useState<NutritionGoal>({
    calories: 2000,
    protein: 50,
    carbs: 250,
    fat: 65,
    fiber: 25,
    water: 2000,
    enabled: true
  })
  const [editedGoals, setEditedGoals] = useState<NutritionGoal>(goals)
  const [todayProgress, setTodayProgress] = useState<DailyProgress>({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  })

  useEffect(() => {
    fetchGoals()
    fetchTodayProgress()
  }, [])

  const fetchGoals = async () => {
    try {
      const response = await fetch('/api/user/nutrition-goals')
      if (response.ok) {
        const data = await response.json()
        setGoals(data)
        setEditedGoals(data)
      }
    } catch (error) {
      console.error('Failed to fetch nutrition goals:', error)
    }
  }

  const fetchTodayProgress = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const response = await fetch(
        `/api/meals?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
      )
      
      if (response.ok) {
        const meals = await response.json()
        const progress = meals.reduce((acc: DailyProgress, meal: any) => ({
          calories: acc.calories + (meal.totalCalories || 0),
          protein: acc.protein + (meal.totalProtein || 0),
          carbs: acc.carbs + (meal.totalCarbs || 0),
          fat: acc.fat + (meal.totalFat || 0),
          fiber: acc.fiber + (meal.totalFiber || 0)
        }), {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0
        })
        
        setTodayProgress(progress)
      }
    } catch (error) {
      console.error('Failed to fetch today\'s progress:', error)
    }
  }

  const handleSaveGoals = async () => {
    try {
      const response = await fetch('/api/user/nutrition-goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedGoals)
      })
      
      if (response.ok) {
        setGoals(editedGoals)
        setIsEditing(false)
        toast({
          title: 'Success',
          description: 'Nutrition goals updated successfully'
        })
      } else {
        throw new Error('Failed to save goals')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save nutrition goals',
        variant: 'destructive'
      })
    }
  }

  const calculateProgress = (current: number, goal: number) => {
    if (goal === 0) return 0
    return Math.min((current / goal) * 100, 100)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'text-red-500'
    if (percentage < 80) return 'text-yellow-500'
    return 'text-green-500'
  }

  const macroTargets = [
    {
      name: 'Calories',
      current: todayProgress.calories,
      goal: goals.calories,
      unit: 'kcal',
      color: 'bg-blue-500'
    },
    {
      name: 'Protein',
      current: todayProgress.protein,
      goal: goals.protein,
      unit: 'g',
      color: 'bg-green-500'
    },
    {
      name: 'Carbs',
      current: todayProgress.carbs,
      goal: goals.carbs,
      unit: 'g',
      color: 'bg-yellow-500'
    },
    {
      name: 'Fat',
      current: todayProgress.fat,
      goal: goals.fat,
      unit: 'g',
      color: 'bg-red-500'
    },
    {
      name: 'Fiber',
      current: todayProgress.fiber,
      goal: goals.fiber,
      unit: 'g',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              <CardTitle>Daily Nutrition Goals</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={goals.enabled}
                onCheckedChange={(checked) => {
                  setGoals(prev => ({ ...prev, enabled: checked }))
                  setEditedGoals(prev => ({ ...prev, enabled: checked }))
                }}
              />
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="mr-2 h-4 w-4" />
                  Edit Goals
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveGoals}>
                    <Save className="mr-2 h-4 w-4" />
                    Save
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setEditedGoals(goals)
                      setIsEditing(false)
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="goal-calories">Daily Calories</Label>
                <Input
                  id="goal-calories"
                  type="number"
                  value={editedGoals.calories}
                  onChange={(e) => setEditedGoals(prev => ({ 
                    ...prev, 
                    calories: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="goal-protein">Protein (g)</Label>
                <Input
                  id="goal-protein"
                  type="number"
                  value={editedGoals.protein}
                  onChange={(e) => setEditedGoals(prev => ({ 
                    ...prev, 
                    protein: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="goal-carbs">Carbs (g)</Label>
                <Input
                  id="goal-carbs"
                  type="number"
                  value={editedGoals.carbs}
                  onChange={(e) => setEditedGoals(prev => ({ 
                    ...prev, 
                    carbs: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="goal-fat">Fat (g)</Label>
                <Input
                  id="goal-fat"
                  type="number"
                  value={editedGoals.fat}
                  onChange={(e) => setEditedGoals(prev => ({ 
                    ...prev, 
                    fat: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="goal-fiber">Fiber (g)</Label>
                <Input
                  id="goal-fiber"
                  type="number"
                  value={editedGoals.fiber}
                  onChange={(e) => setEditedGoals(prev => ({ 
                    ...prev, 
                    fiber: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
              <div>
                <Label htmlFor="goal-water">Water (ml)</Label>
                <Input
                  id="goal-water"
                  type="number"
                  value={editedGoals.water}
                  onChange={(e) => setEditedGoals(prev => ({ 
                    ...prev, 
                    water: parseInt(e.target.value) || 0 
                  }))}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {!goals.enabled && (
                <div className="text-center text-muted-foreground py-4">
                  Nutrition goals are currently disabled. Enable them to track your daily progress.
                </div>
              )}
              
              {goals.enabled && macroTargets.map(macro => {
                const progress = calculateProgress(macro.current, macro.goal)
                const remaining = Math.max(0, macro.goal - macro.current)
                
                return (
                  <div key={macro.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{macro.name}</div>
                      <div className="text-sm text-muted-foreground">
                        <span className={getProgressColor(progress)}>
                          {Math.round(macro.current)}
                        </span>
                        {' / '}
                        <span>{macro.goal} {macro.unit}</span>
                        {remaining > 0 && (
                          <span className="ml-2 text-xs">
                            ({remaining} {macro.unit} remaining)
                          </span>
                        )}
                      </div>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {goals.enabled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayProgress.calories < goals.calories * 0.5 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <div className="font-medium text-yellow-800 dark:text-yellow-200">
                    Low Calorie Intake
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-300">
                    You've consumed less than 50% of your daily calorie goal. Consider having a balanced meal.
                  </div>
                </div>
              )}
              
              {todayProgress.protein < goals.protein * 0.5 && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="font-medium text-blue-800 dark:text-blue-200">
                    Protein Intake Low
                  </div>
                  <div className="text-sm text-blue-700 dark:text-blue-300">
                    Consider adding protein-rich foods like lean meats, eggs, or legumes to meet your daily goal.
                  </div>
                </div>
              )}
              
              {todayProgress.fiber < goals.fiber * 0.5 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-medium text-green-800 dark:text-green-200">
                    Increase Fiber Intake
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    Add more fruits, vegetables, and whole grains to boost your fiber intake.
                  </div>
                </div>
              )}
              
              {todayProgress.calories > goals.calories && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <div className="font-medium text-red-800 dark:text-red-200">
                    Calorie Goal Exceeded
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-300">
                    You've exceeded your daily calorie goal. Consider lighter options for your remaining meals.
                  </div>
                </div>
              )}
              
              {todayProgress.calories >= goals.calories * 0.8 && 
               todayProgress.calories <= goals.calories &&
               todayProgress.protein >= goals.protein * 0.8 && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="font-medium text-green-800 dark:text-green-200">
                    Great Progress!
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300">
                    You're on track to meet your nutrition goals today. Keep it up!
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}