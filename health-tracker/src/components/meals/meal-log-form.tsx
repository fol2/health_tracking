'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Search } from 'lucide-react'
import { useMealStore } from '@/store/meal-store'
import { useToast } from '@/hooks/use-toast'

// Types
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface SelectedFoodItem {
  foodItemId: string
  quantity: number
}

interface MealLogFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// Separate component for food search
function FoodSearch({ onSelect }: { onSelect: (item: FoodItem) => void }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const { toast } = useToast()

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    
    setIsSearching(true)
    try {
      const response = await fetch(`/api/food-items?q=${encodeURIComponent(searchQuery)}`)
      if (!response.ok) throw new Error('Search failed')
      
      const data = await response.json()
      setSearchResults(data)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to search food items',
        variant: 'destructive'
      })
    } finally {
      setIsSearching(false)
    }
  }, [searchQuery, toast])

  const handleSelect = (item: FoodItem) => {
    onSelect(item)
    setSearchResults([])
    setSearchQuery('')
  }

  return (
    <div>
      <Label htmlFor="search">Search Food Items</Label>
      <div className="flex gap-2">
        <Input
          id="search"
          placeholder="Search for food..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearch())}
        />
        <Button
          type="button"
          size="icon"
          onClick={handleSearch}
          disabled={isSearching}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>
      
      {searchResults.length > 0 && (
        <SearchResultsList 
          results={searchResults} 
          onSelect={handleSelect}
        />
      )}
    </div>
  )
}

// Component for displaying search results
function SearchResultsList({ 
  results, 
  onSelect 
}: { 
  results: FoodItem[]
  onSelect: (item: FoodItem) => void 
}) {
  return (
    <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
      {results.map((item) => (
        <button
          key={item.id}
          type="button"
          className="w-full text-left p-2 hover:bg-muted transition-colors"
          onClick={() => onSelect(item)}
        >
          <div className="font-medium">{item.name}</div>
          <div className="text-sm text-muted-foreground">
            {item.calories} cal | {item.protein}g protein | {item.carbs}g carbs | {item.fat}g fat
          </div>
        </button>
      ))}
    </div>
  )
}

// Component for selected food items
function SelectedFoodsList({ 
  items, 
  onUpdateQuantity, 
  onRemove 
}: {
  items: Array<SelectedFoodItem & { details?: FoodItem }>
  onUpdateQuantity: (id: string, quantity: number) => void
  onRemove: (id: string) => void
}) {
  if (items.length === 0) return null

  return (
    <div>
      <Label>Selected Food Items</Label>
      <div className="space-y-2 mt-2">
        {items.map((item) => {
          if (!item.details) return null
          
          return (
            <div key={item.foodItemId} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <div className="font-medium">{item.details.name}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(item.details.calories * item.quantity)} cal
                </div>
              </div>
              <Input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdateQuantity(item.foodItemId, parseFloat(e.target.value))}
                className="w-20"
                min="0.1"
                step="0.1"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => onRemove(item.foodItemId)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Main form component
export function MealLogForm({ onSuccess, onCancel }: MealLogFormProps) {
  const { toast } = useToast()
  const { addMeal, foodItems: storeFoodItems } = useMealStore()
  
  // Form state
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [notes, setNotes] = useState('')
  const [selectedFoodItems, setSelectedFoodItems] = useState<SelectedFoodItem[]>([])
  const [foodItemsCache, setFoodItemsCache] = useState<Map<string, FoodItem>>(new Map())
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Handlers
  const addFoodItem = useCallback((foodItem: FoodItem) => {
    const exists = selectedFoodItems.some(item => item.foodItemId === foodItem.id)
    if (!exists) {
      setSelectedFoodItems(prev => [...prev, { foodItemId: foodItem.id, quantity: 1 }])
      setFoodItemsCache(prev => new Map(prev).set(foodItem.id, foodItem))
    }
  }, [selectedFoodItems])

  const updateQuantity = useCallback((foodItemId: string, quantity: number) => {
    if (quantity <= 0) return
    setSelectedFoodItems(items =>
      items.map(item =>
        item.foodItemId === foodItemId ? { ...item, quantity } : item
      )
    )
  }, [])

  const removeFoodItem = useCallback((foodItemId: string) => {
    setSelectedFoodItems(items => items.filter(item => item.foodItemId !== foodItemId))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          notes: notes.trim() || undefined,
          foodItems: selectedFoodItems.length > 0 ? selectedFoodItems : undefined,
          loggedAt: new Date().toISOString()
        })
      })

      if (!response.ok) throw new Error('Failed to log meal')

      const meal = await response.json()
      addMeal(meal)
      
      toast({
        title: 'Success',
        description: 'Meal logged successfully'
      })
      
      onSuccess?.()
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to log meal',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Enrich selected items with cached details
  const enrichedSelectedItems = selectedFoodItems.map(item => ({
    ...item,
    details: foodItemsCache.get(item.foodItemId) || 
             storeFoodItems.find(f => f.id === item.foodItemId)
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Meal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="mealType">Meal Type</Label>
            <Select value={mealType} onValueChange={(value) => setMealType(value as MealType)}>
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

          <FoodSearch onSelect={addFoodItem} />

          <SelectedFoodsList
            items={enrichedSelectedItems}
            onUpdateQuantity={updateQuantity}
            onRemove={removeFoodItem}
          />

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any notes about this meal..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
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