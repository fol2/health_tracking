'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Search, Plus, Edit, Trash2, Database, Upload, Download } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useMealStore } from '@/store/meal-store'

interface FoodItem {
  id: string
  name: string
  brand?: string
  barcode?: string
  servingSize: number
  servingUnit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  isPublic: boolean
  userId?: string
}

interface FoodFormData {
  name: string
  brand: string
  barcode: string
  servingSize: number
  servingUnit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  sugar: number
  sodium: number
  isPublic: boolean
}

const emptyFoodForm: FoodFormData = {
  name: '',
  brand: '',
  barcode: '',
  servingSize: 100,
  servingUnit: 'g',
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  fiber: 0,
  sugar: 0,
  sodium: 0,
  isPublic: false
}

export function FoodDatabase() {
  const { toast } = useToast()
  const { foodItems, setFoodItems, addFoodItem } = useMealStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredFoods, setFilteredFoods] = useState<FoodItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingFood, setEditingFood] = useState<FoodItem | null>(null)
  const [formData, setFormData] = useState<FoodFormData>(emptyFoodForm)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchFoodItems()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredFoods(
        foodItems.filter(food =>
          food.name.toLowerCase().includes(query) ||
          food.brand?.toLowerCase().includes(query) ||
          food.barcode?.includes(query)
        )
      )
    } else {
      setFilteredFoods(foodItems)
    }
  }, [searchQuery, foodItems])

  const fetchFoodItems = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/food-items')
      if (!response.ok) throw new Error('Failed to fetch food items')
      
      const data = await response.json()
      setFoodItems(data)
      setFilteredFoods(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load food database',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveFood = async () => {
    if (!formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Food name is required',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)
    try {
      const url = editingFood 
        ? `/api/food-items/${editingFood.id}`
        : '/api/food-items'
      
      const response = await fetch(url, {
        method: editingFood ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to save food item')

      const savedFood = await response.json()
      
      if (editingFood) {
        setFoodItems(foodItems.map(food => 
          food.id === editingFood.id ? savedFood : food
        ))
      } else {
        addFoodItem(savedFood)
      }

      toast({
        title: 'Success',
        description: `Food item ${editingFood ? 'updated' : 'created'} successfully`
      })

      setShowAddDialog(false)
      setEditingFood(null)
      setFormData(emptyFoodForm)
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${editingFood ? 'update' : 'create'} food item`,
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteFood = async (foodId: string) => {
    try {
      const response = await fetch(`/api/food-items/${foodId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete food item')

      setFoodItems(foodItems.filter(food => food.id !== foodId))
      toast({
        title: 'Success',
        description: 'Food item deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete food item',
        variant: 'destructive'
      })
    }
  }

  const handleEditFood = (food: FoodItem) => {
    setEditingFood(food)
    setFormData({
      name: food.name,
      brand: food.brand || '',
      barcode: food.barcode || '',
      servingSize: food.servingSize,
      servingUnit: food.servingUnit,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber || 0,
      sugar: food.sugar || 0,
      sodium: food.sodium || 0,
      isPublic: food.isPublic
    })
    setShowAddDialog(true)
  }

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/food-items/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error('Failed to import CSV')

      const result = await response.json()
      toast({
        title: 'Success',
        description: `Imported ${result.count} food items`
      })
      
      fetchFoodItems()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to import CSV file',
        variant: 'destructive'
      })
    }
  }

  const handleExportCSV = async () => {
    try {
      const response = await fetch('/api/food-items/export')
      if (!response.ok) throw new Error('Failed to export')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `food-database-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export food database',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading food database...
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
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              <CardTitle>Food Database</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <label htmlFor="import-csv">
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    Import
                  </span>
                </Button>
                <input
                  id="import-csv"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleImportCSV}
                />
              </label>
              <Button size="sm" onClick={() => {
                setEditingFood(null)
                setFormData(emptyFoodForm)
                setShowAddDialog(true)
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Food
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search foods by name, brand, or barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            {filteredFoods.length} food item{filteredFoods.length !== 1 ? 's' : ''} found
          </div>

          {filteredFoods.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No food items found. Start by adding your first food item!
            </div>
          ) : (
            <div className="space-y-2">
              {filteredFoods.map(food => (
                <Card key={food.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium">{food.name}</div>
                          {food.brand && (
                            <Badge variant="secondary">{food.brand}</Badge>
                          )}
                          {food.isPublic && (
                            <Badge variant="outline">Public</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          Per {food.servingSize}{food.servingUnit}: 
                          {' '}{Math.round(food.calories)} cal
                          {' | '}P: {Math.round(food.protein)}g
                          {' | '}C: {Math.round(food.carbs)}g
                          {' | '}F: {Math.round(food.fat)}g
                          {food.fiber && ` | Fiber: ${Math.round(food.fiber)}g`}
                        </div>
                        {food.barcode && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Barcode: {food.barcode}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditFood(food)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        {!food.isPublic && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteFood(food.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingFood ? 'Edit' : 'Add'} Food Item</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="food-name">Name *</Label>
              <Input
                id="food-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Chicken Breast"
              />
            </div>

            <div>
              <Label htmlFor="food-brand">Brand</Label>
              <Input
                id="food-brand"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                placeholder="e.g., Tyson"
              />
            </div>

            <div>
              <Label htmlFor="food-barcode">Barcode</Label>
              <Input
                id="food-barcode"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="e.g., 1234567890"
              />
            </div>

            <div>
              <Label htmlFor="serving-size">Serving Size</Label>
              <Input
                id="serving-size"
                type="number"
                value={formData.servingSize}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  servingSize: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="serving-unit">Serving Unit</Label>
              <Input
                id="serving-unit"
                value={formData.servingUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, servingUnit: e.target.value }))}
                placeholder="e.g., g, ml, cup"
              />
            </div>

            <div className="col-span-2">
              <h4 className="font-medium mb-2">Nutritional Information</h4>
            </div>

            <div>
              <Label htmlFor="calories">Calories</Label>
              <Input
                id="calories"
                type="number"
                value={formData.calories}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  calories: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="protein">Protein (g)</Label>
              <Input
                id="protein"
                type="number"
                value={formData.protein}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  protein: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="carbs">Carbs (g)</Label>
              <Input
                id="carbs"
                type="number"
                value={formData.carbs}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  carbs: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="fat">Fat (g)</Label>
              <Input
                id="fat"
                type="number"
                value={formData.fat}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fat: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="fiber">Fiber (g)</Label>
              <Input
                id="fiber"
                type="number"
                value={formData.fiber}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  fiber: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="sugar">Sugar (g)</Label>
              <Input
                id="sugar"
                type="number"
                value={formData.sugar}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  sugar: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>

            <div>
              <Label htmlFor="sodium">Sodium (mg)</Label>
              <Input
                id="sodium"
                type="number"
                value={formData.sodium}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  sodium: parseFloat(e.target.value) || 0 
                }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddDialog(false)
              setEditingFood(null)
              setFormData(emptyFoodForm)
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveFood} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}