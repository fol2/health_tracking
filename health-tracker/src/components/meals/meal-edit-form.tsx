'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { X, Search, Plus } from 'lucide-react'
import { useMealStore } from '@/store/meal-store'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { FoodItemForm } from './food-item-form'
import { useNutritionForm } from '@/hooks/use-nutrition-form'
import { NutritionInputs } from '@/components/ui/nutrition-inputs'
import { MealLog, FoodItem, MEAL_TYPE_OPTIONS } from '@/types/meal'

interface MealEditFormProps {
  meal: MealLog
  onSuccess?: () => void
  onCancel?: () => void
}

interface SelectedFoodItem {
  foodItemId: string
  quantity: number
}

export function MealEditForm({ meal, onSuccess, onCancel }: MealEditFormProps) {
  const { toast } = useToast()
  const { updateMeal, foodItems } = useMealStore()
  
  const [mealType, setMealType] = useState<MealLog['mealType']>(meal.mealType)
  const [notes, setNotes] = useState(meal.notes || '')
  const [selectedFoodItems, setSelectedFoodItems] = useState<SelectedFoodItem[]>(
    meal.foodItems?.map(item => ({ 
      foodItemId: item.foodItem.id, 
      quantity: item.quantity || 1 
    })) || []
  )
  
  // Manual nutrition editing
  const [manualMode, setManualMode] = useState(false)
  const nutrition = useNutritionForm({
    initialValues: {
      calories: meal.totalCalories,
      protein: meal.totalProtein,
      carbs: meal.totalCarbs,
      fat: meal.totalFat,
      fiber: meal.totalFiber
    }
  })
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreateFood, setShowCreateFood] = useState(false)

  const searchFoodItems = async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/food-items?q=${encodeURIComponent(searchQuery)}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search food items',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }

  const addFoodItemToMeal = (foodItem: FoodItem) => {
    const exists = selectedFoodItems.find(item => item.foodItemId === foodItem.id)
    if (!exists) {
      setSelectedFoodItems([...selectedFoodItems, { foodItemId: foodItem.id, quantity: 1 }])
      setSearchResults([])
      setSearchQuery('')
    }
  }

  const updateQuantity = (foodItemId: string, quantity: number) => {
    setSelectedFoodItems(items =>
      items.map(item =>
        item.foodItemId === foodItemId ? { ...item, quantity } : item
      )
    )
  }

  const removeFoodItem = (foodItemId: string) => {
    setSelectedFoodItems(items => items.filter(item => item.foodItemId !== foodItemId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      const updateData = manualMode 
        ? {
            mealType,
            notes,
            loggedAt: meal.loggedAt,
            foodItems: [],
            ...nutrition.getNutritionData()
          }
        : {
            mealType,
            notes,
            loggedAt: meal.loggedAt,
            foodItems: selectedFoodItems
          }

      const response = await fetch(`/api/meals/${meal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (response.ok) {
        const updatedMeal = await response.json()
        updateMeal(meal.id, updatedMeal)
        toast({
          title: 'Success',
          description: 'Meal updated successfully'
        })
        onSuccess?.()
      } else {
        throw new Error('Failed to update meal')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update meal',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Edit Meal</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="mealType">Meal Type</Label>
              <Select value={mealType} onValueChange={(value) => setMealType(value as MealLog['mealType'])}>
                <SelectTrigger id="mealType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue={manualMode ? "manual" : "foods"} onValueChange={(v) => setManualMode(v === "manual")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="foods">Food Items</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              
              <TabsContent value="foods" className="space-y-4">
                <div>
                  <Label htmlFor="search">Search Food Items</Label>
                  <div className="flex gap-2">
                    <Input
                      id="search"
                      placeholder="Search for food..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), searchFoodItems())}
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={searchFoodItems}
                      disabled={isSearching}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => setShowCreateFood(true)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className="w-full text-left p-2 hover:bg-muted transition-colors"
                          onClick={() => addFoodItemToMeal(item)}
                        >
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.calories} cal | {item.protein}g protein | {item.carbs}g carbs | {item.fat}g fat
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedFoodItems.length > 0 && (
                  <div>
                    <Label>Selected Food Items</Label>
                    <div className="space-y-2 mt-2">
                      {selectedFoodItems.map((item) => {
                        const foodItem = searchResults.find(f => f.id === item.foodItemId) || 
                                        foodItems.find(f => f.id === item.foodItemId) ||
                                        meal.foodItems?.find(f => f.foodItem.id === item.foodItemId)?.foodItem
                        if (!foodItem) return null
                        
                        return (
                          <div key={item.foodItemId} className="flex items-center gap-2 p-2 border rounded">
                            <div className="flex-1">
                              <div className="font-medium">{foodItem.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {(foodItem.calories || 0) * item.quantity} cal
                              </div>
                            </div>
                            <Input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(item.foodItemId, parseFloat(e.target.value))}
                              className="w-20"
                              min="0.1"
                              step="0.1"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFoodItem(item.foodItemId)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <NutritionInputs 
                  values={nutrition.values}
                  onChange={nutrition.updateField}
                  columns={3}
                  onlyRequired={false}
                />
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this meal..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Meal'}
              </Button>
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showCreateFood} onOpenChange={setShowCreateFood}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Food Item</DialogTitle>
          </DialogHeader>
          <FoodItemForm 
            onSuccess={() => {
              setShowCreateFood(false)
              searchFoodItems()
            }}
            onCancel={() => setShowCreateFood(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}