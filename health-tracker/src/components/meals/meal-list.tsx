'use client'

import { useEffect, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trash2, ChevronDown, ChevronUp, Edit } from 'lucide-react'
import { useMealStore } from '@/store/meal-store'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MealEditForm } from './meal-edit-form'
import { MealLog, MEAL_TYPE_COLORS } from '@/types/meal'


interface NutritionSummary {
  calories: number
  protein: number
  carbs: number
  fat: number
}

// Utility functions
const roundNumber = (num: number | undefined): number => Math.round(num ?? 0)

const calculateNutritionSummary = (meals: MealLog[]): NutritionSummary => ({
  calories: meals.reduce((sum, meal) => sum + (meal.totalCalories ?? 0), 0),
  protein: meals.reduce((sum, meal) => sum + (meal.totalProtein ?? 0), 0),
  carbs: meals.reduce((sum, meal) => sum + (meal.totalCarbs ?? 0), 0),
  fat: meals.reduce((sum, meal) => sum + (meal.totalFat ?? 0), 0)
})

const getDateRange = () => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return { start: today, end: tomorrow }
}

// Sub-components
function NutritionSummaryCard({ summary }: { summary: NutritionSummary }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <NutritionStat value={roundNumber(summary.calories)} label="Calories" />
          <NutritionStat value={`${roundNumber(summary.protein)}g`} label="Protein" />
          <NutritionStat value={`${roundNumber(summary.carbs)}g`} label="Carbs" />
          <NutritionStat value={`${roundNumber(summary.fat)}g`} label="Fat" />
        </div>
      </CardContent>
    </Card>
  )
}

function NutritionStat({ value, label }: { value: string | number; label: string }) {
  return (
    <div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  )
}

function MealCard({ 
  meal, 
  isExpanded, 
  onToggle, 
  onEdit,
  onDelete 
}: {
  meal: MealLog
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <MealHeader 
          meal={meal} 
          isExpanded={isExpanded}
          onToggle={onToggle}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        {isExpanded && <MealDetails meal={meal} />}
      </CardContent>
    </Card>
  )
}

function MealHeader({ 
  meal, 
  isExpanded, 
  onToggle, 
  onEdit,
  onDelete 
}: {
  meal: MealLog
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Badge className={MEAL_TYPE_COLORS[meal.mealType] ?? 'bg-gray-500'}>
          {meal.mealType}
        </Badge>
        <div>
          <div className="font-medium">
            {meal.totalCalories ? `${roundNumber(meal.totalCalories)} cal` : 'No calories'}
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(meal.loggedAt), 'h:mm a')}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button size="icon" variant="ghost" onClick={onToggle}>
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>
        <Button size="icon" variant="ghost" onClick={onEdit}>
          <Edit className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="ghost" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function MealDetails({ meal }: { meal: MealLog }) {
  return (
    <div className="mt-4 space-y-2">
      <div className="grid grid-cols-3 gap-2 text-sm">
        <MacroDetail label="Protein" value={roundNumber(meal.totalProtein)} />
        <MacroDetail label="Carbs" value={roundNumber(meal.totalCarbs)} />
        <MacroDetail label="Fat" value={roundNumber(meal.totalFat)} />
      </div>
      
      {meal.foodItems && meal.foodItems.length > 0 && (
        <FoodItemsList items={meal.foodItems} />
      )}
      
      {meal.notes && <MealNotes notes={meal.notes} />}
    </div>
  )
}

function MacroDetail({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span> {value}g
    </div>
  )
}

function FoodItemsList({ items }: { items: MealLog['foodItems'] }) {
  if (!items) return null
  
  return (
    <div className="border-t pt-2">
      <div className="text-sm font-medium mb-1">Food Items:</div>
      {items.map((item) => (
        <div key={item.id} className="text-sm text-muted-foreground">
          • {item.foodItem.name} ({item.quantity}x)
        </div>
      ))}
    </div>
  )
}

function MealNotes({ notes }: { notes: string }) {
  return (
    <div className="border-t pt-2">
      <div className="text-sm font-medium mb-1">Notes:</div>
      <div className="text-sm text-muted-foreground">{notes}</div>
    </div>
  )
}

function EmptyState() {
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

function LoadingState() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-muted-foreground">Loading meals...</div>
      </CardContent>
    </Card>
  )
}

// Main component
export const MealList = forwardRef<{ fetchTodayMeals: () => void }>(function MealList(_, ref) {
  const { toast } = useToast()
  const { todayMeals, setTodayMeals, deleteMeal, updateMeal } = useMealStore()
  const [isLoading, setIsLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null)

  // Fetch today's meals
  const fetchTodayMeals = useCallback(async () => {
    setIsLoading(true)
    try {
      const { start, end } = getDateRange()
      const response = await fetch(
        `/api/meals?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
      )
      
      if (!response.ok) throw new Error('Failed to fetch meals')
      
      const data = await response.json()
      setTodayMeals(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch meals',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [setTodayMeals, toast])

  // Expose fetchTodayMeals via ref
  useImperativeHandle(ref, () => ({
    fetchTodayMeals
  }), [fetchTodayMeals])

  // Fetch on mount only
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoading(true)
      try {
        const { start, end } = getDateRange()
        const response = await fetch(
          `/api/meals?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
        )
        
        if (!response.ok) throw new Error('Failed to fetch meals')
        
        const data = await response.json()
        setTodayMeals(data)
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to fetch meals',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }
    
    loadInitialData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handlers
  const handleDelete = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/meals/${id}`, { method: 'DELETE' })
      
      if (!response.ok) throw new Error('Failed to delete meal')
      
      deleteMeal(id)
      toast({
        title: 'Success',
        description: 'Meal deleted successfully'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete meal',
        variant: 'destructive'
      })
    }
  }, [deleteMeal, toast])

  const toggleExpanded = useCallback((id: string) => {
    setExpandedMeals(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  // Calculate summary
  const nutritionSummary = useMemo(
    () => calculateNutritionSummary(todayMeals),
    [todayMeals]
  )

  // Render states
  if (isLoading) return <LoadingState />
  if (todayMeals.length === 0) return <EmptyState />

  return (
    <div className="space-y-4">
      <NutritionSummaryCard summary={nutritionSummary} />
      
      <div className="space-y-2">
        {todayMeals.map((meal) => (
          <MealCard
            key={meal.id}
            meal={meal}
            isExpanded={expandedMeals.has(meal.id)}
            onToggle={() => toggleExpanded(meal.id)}
            onEdit={() => setEditingMeal(meal)}
            onDelete={() => handleDelete(meal.id)}
          />
        ))}
      </div>

      <Dialog open={!!editingMeal} onOpenChange={(open) => !open && setEditingMeal(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Meal</DialogTitle>
          </DialogHeader>
          {editingMeal && (
            <MealEditForm 
              meal={editingMeal}
              onSuccess={() => {
                setEditingMeal(null)
                fetchTodayMeals() // Refresh the list instead of reloading
              }}
              onCancel={() => setEditingMeal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
})