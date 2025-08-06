'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X, Search, Sparkles, Loader2, AlertCircle, Calendar, Clock } from 'lucide-react'
import { useMealStore } from '@/store/meal-store'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

// Types
type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  _extractedQuantity?: number
  _extractedUnit?: string
}

interface SelectedFoodItem {
  foodItemId: string
  quantity: number
}

interface MealLogFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

// Component for AI extraction
function AIExtraction({ onExtract }: { onExtract: (items: FoodItem[]) => void }) {
  const [description, setDescription] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleExtract = async () => {
    if (!description.trim()) {
      setError('Please describe what you ate')
      return
    }

    setIsExtracting(true)
    setError(null)
    
    try {
      const response = await fetch('/api/meals/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract food data')
      }

      if (data.success && data.items?.length > 0) {
        // Convert extracted items to FoodItem format
        const foodItems: FoodItem[] = data.items.map((item: any, index: number) => {
          // AI returns total nutrition for the quantity specified
          // We need to convert to per 100g/100ml for database storage
          const quantity = item.quantity || 100
          const unit = item.unit || 'g'
          
          // Determine the conversion factor to per 100 units
          // For liquids (ml), we still use per 100ml
          const conversionFactor = 100 / quantity
          
          return {
            id: `ai-${Date.now()}-${index}`, // Temporary ID for new items
            name: item.name,
            // Convert all nutrition values to per 100g/100ml
            calories: Math.round(item.nutrition.calories * conversionFactor),
            protein: Math.round(item.nutrition.protein * conversionFactor * 10) / 10,
            carbs: Math.round(item.nutrition.carbs * conversionFactor * 10) / 10,
            fat: Math.round(item.nutrition.fat * conversionFactor * 10) / 10,
            fiber: item.nutrition.fiber ? Math.round(item.nutrition.fiber * conversionFactor * 10) / 10 : undefined,
            sugar: item.nutrition.sugar ? Math.round(item.nutrition.sugar * conversionFactor * 10) / 10 : undefined,
            sodium: item.nutrition.sodium ? Math.round(item.nutrition.sodium * conversionFactor) : undefined,
            // Store the original quantity from extraction for initial selection
            _extractedQuantity: quantity,
            _extractedUnit: unit
          }
        })
        
        onExtract(foodItems)
        setDescription('') // Clear after successful extraction
        
        toast({
          title: 'Success!',
          description: `Extracted ${foodItems.length} food item(s)`
        })
      } else {
        throw new Error(data.warnings?.[0] || 'No food items found')
      }
    } catch (error) {
      console.error('Extraction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract food data')
    } finally {
      setIsExtracting(false)
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="ai-description">Describe Your Meal</Label>
        <Textarea
          id="ai-description"
          placeholder="E.g., 'I had a chicken sandwich with fries' or '今天吃了雞胸肉配飯'"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[80px] mt-1"
          disabled={isExtracting}
        />
        <p className="text-sm text-muted-foreground mt-1">
          Describe in any language. Be specific about portions if possible.
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button
        type="button"
        onClick={handleExtract}
        disabled={isExtracting || !description.trim()}
        className="w-full"
      >
        {isExtracting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Extracting...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Extract Food Items
          </>
        )}
      </Button>
    </div>
  )
}

// Component for food search
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
    <div className="space-y-2">
      <Label htmlFor="search">Search Food Database</Label>
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
        <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
          {searchResults.map((item) => (
            <button
              key={item.id}
              type="button"
              className="w-full text-left p-2 hover:bg-muted transition-colors"
              onClick={() => handleSelect(item)}
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
  )
}

// Component for selected food items
function SelectedFoodsList({ 
  items, 
  onUpdateQuantity, 
  onRemove 
}: {
  items: Array<SelectedFoodItem & { details?: FoodItem & { _extractedUnit?: string } }>
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
          
          // Determine unit based on food item metadata or default to 'g'
          const unit = item.details._extractedUnit || 'g'
          const isLiquid = unit === 'ml' || unit === 'l'
          const displayUnit = isLiquid ? 'ml' : 'g'
          
          // Convert quantity (multiplier) to actual amount
          const actualAmount = Math.round(item.quantity * 100)
          
          return (
            <div key={item.foodItemId} className="flex items-center gap-2 p-2 border rounded">
              <div className="flex-1">
                <div className="font-medium">{item.details.name}</div>
                <div className="text-sm text-muted-foreground">
                  {Math.round(item.details.calories * item.quantity)} cal
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  inputMode="numeric"
                  value={actualAmount}
                  onChange={(e) => {
                    const value = e.target.value
                    // Allow empty value for editing
                    if (value === '') {
                      onUpdateQuantity(item.foodItemId, 0.01) // Set to minimal value
                      return
                    }
                    // Only allow numbers
                    if (!/^\d+$/.test(value)) return
                    
                    const newAmount = parseInt(value, 10)
                    if (newAmount > 0) {
                      onUpdateQuantity(item.foodItemId, newAmount / 100)
                    }
                  }}
                  className="flex h-9 w-24 rounded-md border border-input bg-background px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                />
                <span className="text-sm text-muted-foreground w-8">
                  {displayUnit}
                </span>
              </div>
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
  const [activeTab, setActiveTab] = useState('search')
  
  // Date and time state - default to now
  const now = new Date()
  const [mealDate, setMealDate] = useState(format(now, 'yyyy-MM-dd'))
  const [mealTime, setMealTime] = useState(format(now, 'HH:mm'))
  
  // Quick time presets
  const setQuickTime = useCallback((preset: 'now' | 'breakfast' | 'lunch' | 'dinner') => {
    const today = new Date()
    setMealDate(format(today, 'yyyy-MM-dd'))
    
    switch (preset) {
      case 'now':
        setMealTime(format(today, 'HH:mm'))
        break
      case 'breakfast':
        setMealTime('08:00')
        setMealType('breakfast')
        break
      case 'lunch':
        setMealTime('12:00')
        setMealType('lunch')
        break
      case 'dinner':
        setMealTime('19:00')
        setMealType('dinner')
        break
    }
  }, [])

  // Handlers
  const addFoodItem = useCallback((foodItem: FoodItem) => {
    const exists = selectedFoodItems.some(item => item.foodItemId === foodItem.id)
    if (!exists) {
      // Use extracted quantity if available
      const quantity = (foodItem as any)._extractedQuantity ? 
        (foodItem as any)._extractedQuantity / 100 : // Convert to serving size (assuming base is 100g)
        1
      
      setSelectedFoodItems(prev => [...prev, { foodItemId: foodItem.id, quantity }])
      setFoodItemsCache(prev => new Map(prev).set(foodItem.id, foodItem))
    }
  }, [selectedFoodItems])

  const handleAIExtract = useCallback((items: FoodItem[]) => {
    // Add all extracted items to selected
    items.forEach(item => addFoodItem(item))
    // Switch to search tab to show selected items
    setActiveTab('search')
  }, [addFoodItem])

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
    
    if (selectedFoodItems.length === 0) {
      toast({
        title: 'No food items',
        description: 'Please add at least one food item',
        variant: 'destructive'
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      // First, save any AI-extracted items as new food items
      const newFoodItemIds = new Map<string, string>()
      
      for (const item of selectedFoodItems) {
        if (item.foodItemId.startsWith('ai-')) {
          const foodData = foodItemsCache.get(item.foodItemId)
          if (foodData) {
            // Get the original unit from extracted data
            const unit = (foodData as any)._extractedUnit || 'g'
            const isLiquid = unit === 'ml' || unit === 'l'
            
            // Create new food item in database
            const response = await fetch('/api/food-items', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: foodData.name,
                calories: foodData.calories,
                protein: foodData.protein,
                carbs: foodData.carbs,
                fat: foodData.fat,
                fiber: foodData.fiber,
                sugar: foodData.sugar,
                sodium: foodData.sodium,
                servingSize: 100, // Always per 100 units
                servingUnit: isLiquid ? 'ml' : 'g' // Use ml for liquids, g for solids
              })
            })
            
            if (response.ok) {
              const newItem = await response.json()
              newFoodItemIds.set(item.foodItemId, newItem.id)
            }
          }
        }
      }
      
      // Update selected items with real IDs
      const finalFoodItems = selectedFoodItems.map(item => ({
        foodItemId: newFoodItemIds.get(item.foodItemId) || item.foodItemId,
        quantity: item.quantity
      }))
      
      // Combine date and time to create the loggedAt timestamp
      const loggedAt = new Date(`${mealDate}T${mealTime}:00`)
      
      // Log the meal
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType,
          notes: notes.trim() || undefined,
          foodItems: finalFoodItems,
          loggedAt: loggedAt.toISOString()
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
    } catch (error) {
      console.error('Error logging meal:', error)
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
    <Card className="w-full">
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

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="mealDate">Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="mealDate"
                    type="date"
                    value={mealDate}
                    onChange={(e) => setMealDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="mealTime">Time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="mealTime"
                    type="time"
                    value={mealTime}
                    onChange={(e) => setMealTime(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickTime('now')}
              >
                Now
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickTime('breakfast')}
              >
                Breakfast (8:00)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickTime('lunch')}
              >
                Lunch (12:00)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setQuickTime('dinner')}
              >
                Dinner (19:00)
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="search">
                <Search className="mr-2 h-4 w-4" />
                Search Food
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="mr-2 h-4 w-4" />
                AI Extract
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="search" className="mt-4">
              <FoodSearch onSelect={addFoodItem} />
            </TabsContent>
            
            <TabsContent value="ai" className="mt-4">
              <AIExtraction onExtract={handleAIExtract} />
            </TabsContent>
          </Tabs>

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
            <Button type="submit" disabled={isSubmitting || selectedFoodItems.length === 0}>
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