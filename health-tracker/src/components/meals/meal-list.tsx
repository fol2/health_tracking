'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, Edit, ChevronDown, ChevronUp } from 'lucide-react'
import { useMealStore } from '@/store/meal-store'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

export function MealList() {
  const { toast } = useToast()
  const { todayMeals, setTodayMeals, deleteMeal } = useMealStore()
  const [isLoading, setIsLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchTodayMeals()
  }, [])

  const fetchTodayMeals = async () => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await fetch(
        `/api/meals?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`
      )
      
      if (response.ok) {
        const data = await response.json()
        setTodayMeals(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch meals',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/meals/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        deleteMeal(id)
        toast({
          title: 'Success',
          description: 'Meal deleted successfully'
        })
      } else {
        throw new Error('Failed to delete meal')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete meal',
        variant: 'destructive'
      })
    }
  }

  const toggleExpanded = (id: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getMealTypeColor = (type: string) => {
    switch (type) {
      case 'breakfast': return 'bg-yellow-500'
      case 'lunch': return 'bg-blue-500'
      case 'dinner': return 'bg-purple-500'
      case 'snack': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading meals...</div>
        </CardContent>
      </Card>
    )
  }

  if (todayMeals.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            No meals logged today. Start by logging your first meal!
          </div>
        </CardContent>
      </Card>
    )
  }

  const totalCalories = todayMeals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0)
  const totalProtein = todayMeals.reduce((sum, meal) => sum + (meal.totalProtein || 0), 0)
  const totalCarbs = todayMeals.reduce((sum, meal) => sum + (meal.totalCarbs || 0), 0)
  const totalFat = todayMeals.reduce((sum, meal) => sum + (meal.totalFat || 0), 0)

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Today's Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{Math.round(totalCalories)}</div>
              <div className="text-sm text-muted-foreground">Calories</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(totalProtein)}g</div>
              <div className="text-sm text-muted-foreground">Protein</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(totalCarbs)}g</div>
              <div className="text-sm text-muted-foreground">Carbs</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{Math.round(totalFat)}g</div>
              <div className="text-sm text-muted-foreground">Fat</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {todayMeals.map((meal) => {
          const isExpanded = expandedMeals.has(meal.id)
          
          return (
            <Card key={meal.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge className={getMealTypeColor(meal.mealType)}>
                      {meal.mealType}
                    </Badge>
                    <div>
                      <div className="font-medium">
                        {meal.totalCalories ? `${Math.round(meal.totalCalories)} cal` : 'No calories'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(meal.loggedAt), 'h:mm a')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleExpanded(meal.id)}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDelete(meal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Protein:</span> {Math.round(meal.totalProtein || 0)}g
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carbs:</span> {Math.round(meal.totalCarbs || 0)}g
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fat:</span> {Math.round(meal.totalFat || 0)}g
                      </div>
                    </div>
                    
                    {meal.foodItems && meal.foodItems.length > 0 && (
                      <div className="border-t pt-2">
                        <div className="text-sm font-medium mb-1">Food Items:</div>
                        {meal.foodItems.map((item: any) => (
                          <div key={item.id} className="text-sm text-muted-foreground">
                            • {item.foodItem.name} ({item.quantity}x)
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {meal.notes && (
                      <div className="border-t pt-2">
                        <div className="text-sm font-medium mb-1">Notes:</div>
                        <div className="text-sm text-muted-foreground">{meal.notes}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}