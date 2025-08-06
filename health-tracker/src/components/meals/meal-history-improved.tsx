'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
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

// Types
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

interface QuickFilter {
  label: string
  value: () => { from: Date; to: Date }
}

// Constants
const INITIAL_DATE_RANGE = {
  from: subDays(new Date(), 30),
  to: new Date()
}

const QUICK_DATE_FILTERS: QuickFilter[] = [
  { label: 'Today', value: () => ({ from: new Date(), to: new Date() }) },
  { label: 'Last 7 Days', value: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
  { label: 'Last 30 Days', value: () => ({ from: subDays(new Date(), 30), to: new Date() }) },
  { label: 'This Month', value: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) }
]

const INITIAL_FILTERS: FilterOptions = {
  searchQuery: '',
  mealType: 'all',
  dateRange: INITIAL_DATE_RANGE,
  sortBy: 'date',
  sortOrder: 'desc'
}

export function MealHistory() {
  const { toast } = useToast()
  const { setMeals, deleteMeal } = useMealStore()
  
  // State
  const [meals, setLocalMeals] = useState<MealLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set())
  const [editingMeal, setEditingMeal] = useState<MealLog | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>(INITIAL_FILTERS)

  // Fetch meal history with proper error handling
  const fetchMealHistory = useCallback(async (dateRange = filters.dateRange) => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams()
      if (dateRange.from) {
        params.append('startDate', dateRange.from.toISOString())
      }
      if (dateRange.to) {
        params.append('endDate', dateRange.to.toISOString())
      }

      const response = await fetch(`/api/meals?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch meals: ${response.statusText}`)
      }
      
      const data = await response.json()
      setLocalMeals(data)
      setMeals(data)
    } catch (error) {
      console.error('Error fetching meals:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load meal history',
        variant: 'destructive'
      })
      // Set empty array on error to prevent infinite loading
      setLocalMeals([])
    } finally {
      setIsLoading(false)
    }
  }, [filters.dateRange, setMeals, toast])

  // Initial load - only run once on mount
  useEffect(() => {
    fetchMealHistory(INITIAL_DATE_RANGE)
  }, []) // Intentionally empty to run only on mount

  // Filter and sort meals
  const filteredMeals = useMemo(() => {
    let filtered = [...meals]

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      filtered = filtered.filter(meal => 
        meal.notes?.toLowerCase().includes(query) ||
        meal.foodItems?.some(item => 
          item.foodItem.name.toLowerCase().includes(query)
        )
      )
    }

    // Meal type filter
    if (filters.mealType !== 'all') {
      filtered = filtered.filter(meal => meal.mealType === filters.mealType)
    }

    // Sorting
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

    return filtered
  }, [meals, filters])

  // Handlers
  const handleDeleteMeal = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/meals/${id}`, { method: 'DELETE' })
      
      if (!response.ok) {
        throw new Error('Failed to delete meal')
      }
      
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
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }, [])

  const handleApplyFilters = useCallback(() => {
    fetchMealHistory(filters.dateRange)
  }, [fetchMealHistory, filters.dateRange])

  const handleQuickFilter = useCallback((getDateRange: () => { from: Date; to: Date }) => {
    const newDateRange = getDateRange()
    setFilters(prev => ({ ...prev, dateRange: newDateRange }))
  }, [])

  const handleDateRangeChange = useCallback((field: 'from' | 'to', date: Date | undefined) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [field]: date
      }
    }))
  }, [])

  // Loading state
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
      {/* Filter Controls */}
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
              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search Input */}
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

                {/* Meal Type Select */}
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

                {/* Sort By Select */}
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

                {/* Sort Order Select */}
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

              {/* Quick Filters */}
              <div className="flex flex-wrap gap-2">
                <Label>Quick Filters:</Label>
                {QUICK_DATE_FILTERS.map(filter => (
                  <Button
                    key={filter.label}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>

              {/* Date Range Pickers */}
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
                          onSelect={(date) => handleDateRangeChange('from', date)}
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
                          onSelect={(date) => handleDateRangeChange('to', date)}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <Button onClick={handleApplyFilters}>Apply Filters</Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Results Count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredMeals.length} meal{filteredMeals.length !== 1 ? 's' : ''}
      </div>

      {/* Meal List */}
      {filteredMeals.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No meals found matching your criteria
            </div>
          </CardContent>
        </Card>
      ) : (
        <MealList
          meals={filteredMeals}
          expandedMeals={expandedMeals}
          onToggleExpanded={toggleExpanded}
          onEdit={setEditingMeal}
          onDelete={handleDeleteMeal}
        />
      )}

      {/* Edit Dialog */}
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

// Extracted Meal List Component for better performance
interface MealListProps {
  meals: MealLog[]
  expandedMeals: Set<string>
  onToggleExpanded: (id: string) => void
  onEdit: (meal: MealLog) => void
  onDelete: (id: string) => void
}

function MealList({ meals, expandedMeals, onToggleExpanded, onEdit, onDelete }: MealListProps) {
  return (
    <div className="space-y-2">
      {meals.map(meal => (
        <MealCard
          key={meal.id}
          meal={meal}
          isExpanded={expandedMeals.has(meal.id)}
          onToggleExpanded={() => onToggleExpanded(meal.id)}
          onEdit={() => onEdit(meal)}
          onDelete={() => onDelete(meal.id)}
        />
      ))}
    </div>
  )
}

// Extracted Meal Card Component
interface MealCardProps {
  meal: MealLog
  isExpanded: boolean
  onToggleExpanded: () => void
  onEdit: () => void
  onDelete: () => void
}

function MealCard({ meal, isExpanded, onToggleExpanded, onEdit, onDelete }: MealCardProps) {
  const formattedDate = useMemo(() => ({
    date: format(new Date(meal.loggedAt), 'EEEE, MMMM d, yyyy'),
    time: format(new Date(meal.loggedAt), 'h:mm a')
  }), [meal.loggedAt])

  const nutrition = useMemo(() => ({
    calories: Math.round(meal.totalCalories || 0),
    protein: Math.round(meal.totalProtein || 0),
    carbs: Math.round(meal.totalCarbs || 0),
    fat: Math.round(meal.totalFat || 0)
  }), [meal])

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="font-medium">{formattedDate.date}</div>
              <div className="text-sm text-muted-foreground">{formattedDate.time}</div>
            </div>
            <Badge className={MEAL_TYPE_COLORS[meal.mealType as keyof typeof MEAL_TYPE_COLORS]}>
              {meal.mealType}
            </Badge>
            <div className="text-sm">
              <span className="font-medium">{nutrition.calories} cal</span>
              {' | '}
              <span>P: {nutrition.protein}g</span>
              {' | '}
              <span>C: {nutrition.carbs}g</span>
              {' | '}
              <span>F: {nutrition.fat}g</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={onToggleExpanded}>
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

        {isExpanded && <MealDetails meal={meal} />}
      </CardContent>
    </Card>
  )
}

// Extracted Meal Details Component
function MealDetails({ meal }: { meal: MealLog }) {
  return (
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
  )
}