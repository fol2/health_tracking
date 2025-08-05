'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { useMealStore } from '@/store/meal-store'
import { useNutritionForm } from '@/hooks/use-nutrition-form'
import { NutritionInputs } from '@/components/ui/nutrition-inputs'

interface FoodItemFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function FoodItemForm({ onSuccess, onCancel }: FoodItemFormProps) {
  const { toast } = useToast()
  const { addFoodItem } = useMealStore()
  
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    servingSize: '100',
    servingUnit: 'g'
  })
  
  const nutrition = useNutritionForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !nutrition.validate()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }
    
    setIsSubmitting(true)
    try {
      const nutritionData = nutrition.getNutritionData()
      const response = await fetch('/api/food-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          brand: formData.brand || undefined,
          servingSize: parseFloat(formData.servingSize),
          ...nutritionData,
          isPublic: false
        })
      })

      if (response.ok) {
        const foodItem = await response.json()
        addFoodItem(foodItem)
        toast({
          title: 'Success',
          description: 'Food item created successfully'
        })
        onSuccess?.()
      } else {
        throw new Error('Failed to create food item')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create food item',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Custom Food Item</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Chicken Breast"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="brand">Brand (Optional)</Label>
              <Input
                id="brand"
                placeholder="e.g., Tyson"
                value={formData.brand}
                onChange={(e) => updateField('brand', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="servingSize">Serving Size</Label>
              <Input
                id="servingSize"
                type="number"
                value={formData.servingSize}
                onChange={(e) => updateField('servingSize', e.target.value)}
                min="0.1"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="servingUnit">Unit</Label>
              <Input
                id="servingUnit"
                placeholder="g, oz, cup, etc."
                value={formData.servingUnit}
                onChange={(e) => updateField('servingUnit', e.target.value)}
              />
            </div>
          </div>

          <NutritionInputs 
            values={nutrition.values}
            onChange={nutrition.updateField}
            columns={4}
          />

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Create Food Item'}
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