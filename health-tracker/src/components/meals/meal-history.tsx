'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Search, Calendar as CalendarIcon, Filter, ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns'
import { useToast } from '@/hooks/use-toast'
import { useMealStore } from '@/store/meal-store'
import { MEAL_TYPE_COLORS, MealLog } from '@/types/meal'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MealEditForm } from './meal-edit-form'

interface FilterOptions {
  searchQuery: string
  mealType: string
  dateRange: {
    from: Date | undefined
    to: Date | undefined
  }
  sortBy: 'date' | 'calories' | 'protein'
  sortOrder: 'asc' | 'desc'
}

export function MealHistory() {
  const { toast } = useToast()
  const { setMeals, deleteMeal } = useMealStore()
  const [meals, setLocalMeals] = useState<MealLog[]>([])
  const [filteredMeals, setFilteredMeals] = useState<MealLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    mealType: 'all',
    dateRange: {
      from: subDays(new Date(), 30),
      to: new Date()
    },
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const fetchMealHistory = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateRange.from) {
        params.append('startDate', filters.dateRange.from.toISOString())
      }
      if (filters.dateRange.to) {
        params.append('endDate', filters.dateRange.to.toISOString())
      }

      const response = await fetch(`/api/meals?${params}`)
      if (!response.ok) throw new Error('Failed to fetch meal history')
      
      const data = await response.json()
      setLocalMeals(data)
      setMeals(data)
    } catch (error) {
      console.error('Error fetching meals:', error)
      toast({
        title: 'Error',
        description: 'Failed to load meal history',
        variant: 'destructive'
      })
      // Set empty array on error to prevent infinite loading
      setLocalMeals([])
    } finally {
      setIsLoading(false)
    }
  }, [filters.dateRange.from, filters.dateRange.to, setMeals, toast])

  useEffect(() => {
    // Only fetch on mount, not when filters change
    // User must click "Apply Filters" button to fetch with new filters
    const initialFetch = async () => {
      setIsLoading(true)
      try {
        const params = new URLSearchParams()
        const from = subDays(new Date(), 30)
        const to = new Date()
        params.append('startDate', from.toISOString())
        params.append('endDate', to.toISOString())

        const response = await fetch(`/api/meals?${params}`)
        if (!response.ok) throw new Error('Failed to fetch meal history')
        
        const data = await response.json()
        setLocalMeals(data)
        setMeals(data)
      } catch (error) {
        console.error('Error on initial fetch:', error)
        toast({
          title: 'Error',
          description: 'Failed to load meal history',
          variant: 'destructive'
        })
        // Set empty array on error to prevent infinite loading
        setLocalMeals([])
      } finally {
        setIsLoading(false)
      }
    }
    
    initialFetch()
  }, []) // Empty dependency array - only run on mount

  useEffect(() => {
    let filtered = [...meals]

    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(meal => 
        meal.notes?.toLowerCase().includes(query) ||
        meal.foodItems?.some(item => 
          item.foodItem.name.toLowerCase().includes(query)
        )
      )
    }

    // Apply meal type filter
    if (filters.mealType !== 'all') {
      filtered = filtered.filter(meal => meal.mealType === filters.mealType)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let compareValue = 0
      
      switch (filters.sortBy) {
        case 'date':
          compareValue = new Date(a.loggedAt).getTime() - new Date(b.loggedAt).getTime()
          break
        case 'calories':
          compareValue = (a.totalCalories || 0) - (b.totalCalories || 0)
          break
        case 'protein':
          compareValue = (a.totalProtein || 0) - (b.totalProtein || 0)
          break
      }
      
      return filters.sortOrder === 'asc' ? compareValue : -compareValue
    })

    setFilteredMeals(filtered)
  }, [meals, filters])

  const handleDeleteMeal = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/meals/${id}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Failed to delete meal')
      
      deleteMeal(id)
      setLocalMeals(prev => prev.filter(meal => meal.id !== id))
      toast({
        title: 'Success',
        description: 'Meal deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting meal:', error)
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
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const quickDateFilters = [
    { label: 'Today', value: () => ({ from: new Date(), to: new Date() }) },
    { label: 'Last 7 Days', value: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: 'Last 30 Days', value: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
    { label: 'This Month', value: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) }
  ]

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading meal history...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Meal History</CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {showFilters ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        
        {showFilters && (
          <CardContent className="border-b">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search meals..."
                      value={filters.searchQuery}
                      onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                      className="pl-8"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="meal-type">Meal Type</Label>
                  <Select
                    value={filters.mealType}
                    onValueChange={(value) => setFilters(prev => ({ ...prev, mealType: value }))}
                  >
                    <SelectTrigger id="meal-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="breakfast">Breakfast</SelectItem>
                      <SelectItem value="lunch">Lunch</SelectItem>
                      <SelectItem value="dinner">Dinner</SelectItem>
                      <SelectItem value="snack">Snack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort-by">Sort By</Label>
                  <Select
                    value={filters.sortBy}
                    onValueChange={(value: 'date' | 'calories' | 'protein') => 
                      setFilters(prev => ({ ...prev, sortBy: value }))
                    }
                  >
                    <SelectTrigger id="sort-by">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="calories">Calories</SelectItem>
                      <SelectItem value="protein">Protein</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="sort-order">Order</Label>
                  <Select
                    value={filters.sortOrder}
                    onValueChange={(value: 'asc' | 'desc') => 
                      setFilters(prev => ({ ...prev, sortOrder: value }))
                    }
                  >
                    <SelectTrigger id="sort-order">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Newest First</SelectItem>
                      <SelectItem value="asc">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Label>Quick Filters:</Label>
                {quickDateFilters.map(filter => (
                  <Button
                    key={filter.label}
                    variant="outline"
                    size="sm"
                    onClick={() => setFilters(prev => ({ ...prev, dateRange: filter.value() }))}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.from ? format(filters.dateRange.from, 'PPP') : 'From date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.from}
                          onSelect={(date) => setFilters(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, from: date || undefined }
                          }))}
                        />
                      </PopoverContent>
                    </Popover>

                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className="justify-start text-left font-normal">
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filters.dateRange.to ? format(filters.dateRange.to, 'PPP') : 'To date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={filters.dateRange.to}
                          onSelect={(date) => setFilters(prev => ({ 
                            ...prev, 
                            dateRange: { ...prev.dateRange, to: date || undefined }
                          }))}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button onClick={fetchMealHistory}>Apply Filters</Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''}
      </div>

      {filteredMeals.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No meals found matching your criteria
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredMeals.map(meal => (
            <Card key={meal.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="font-medium">
                        {format(new Date(meal.loggedAt), 'EEEE, MMMM d, yyyy')}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(meal.loggedAt), 'h:mm a')}
                      </div>
                    </div>
                    <Badge className={MEAL_TYPE_COLORS[meal.mealType as keyof typeof MEAL_TYPE_COLORS]}>
                      {meal.mealType}
                    </Badge>
                    <div className="text-sm">
                      <span className="font-medium">{Math.round(meal.totalCalories || 0)} cal</span>
                      {' | '}
                      <span>P: {Math.round(meal.totalProtein || 0)}g</span>
                      {' | '}
                      <span>C: {Math.round(meal.totalCarbs || 0)}g</span>
                      {' | '}
                      <span>F: {Math.round(meal.totalFat || 0)}g</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => toggleExpanded(meal.id)}
                    >
                      {expandedMeals.has(meal.id) ? 
                        <ChevronUp className="h-4 w-4" /> : 
                        <ChevronDown className="h-4 w-4" />
                      }
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setEditingMeal(meal)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDeleteMeal(meal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {expandedMeals.has(meal.id) && (
                  <div className="mt-4 space-y-2">
                    {meal.foodItems && meal.foodItems.length > 0 && (
                      <div className="border-t pt-2">
                        <div className="text-sm font-medium mb-1">Food Items:</div>
                        {meal.foodItems.map((item) => (
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
          ))}
        </div>
      )}

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
                fetchMealHistory()
              }}
              onCancel={() => setEditingMeal(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}