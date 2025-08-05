'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, X, Search } from 'lucide-react'
import { useMealStore } from '@/store/meal-store'
import { useToast } from '@/hooks/use-toast'

interface MealLogFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function MealLogForm({ onSuccess, onCancel }: MealLogFormProps) {
  const { toast } = useToast()
  const { addMeal, foodItems } = useMealStore()
  
  const [mealType, setMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('breakfast')
  const [notes, setNotes] = useState('')
  const [selectedFoodItems, setSelectedFoodItems] = useState<Array<{ foodItemId: string; quantity: number }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const addFoodItemToMeal = (foodItem: any) => {
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
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          notes,
          foodItems: selectedFoodItems,
          loggedAt: new Date().toISOString()
        })
      })

      if (response.ok) {
        const meal = await response.json()
        addMeal(meal)
        toast({
          title: 'Success',
          description: 'Meal logged successfully'
        })
        onSuccess?.()
      } else {
        throw new Error('Failed to log meal')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to log meal',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mealType">Meal Type</Label>
            <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
              <SelectTrigger id="mealType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                                  foodItems.find(f => f.id === item.foodItemId)
                  if (!foodItem) return null
                  
                  return (
                    <div key={item.foodItemId} className="flex items-center gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{foodItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {foodItem.calories * item.quantity} cal
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
              {isSubmitting ? 'Logging...' : 'Log Meal'}
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
  )
}