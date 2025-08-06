'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Star, StarOff, Clock, Plus, Trash2, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { MEAL_TYPE_COLORS } from '@/types/meal'

interface FoodItem {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface TemplateFoodItem {
  foodItemId: string
  quantity: number
  foodItem: FoodItem
}

interface MealTemplate {
  id: string
  name: string
  mealType: string
  isFavorite: boolean
  foodItems: TemplateFoodItem[]
  createdAt: string
}

export function MealTemplates() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<MealTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<MealTemplate | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [createFromMeal, setCreateFromMeal] = useState<string | null>(null)
  const [templateName, setTemplateName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/meals/templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load meal templates',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a template name',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      // If creating from a meal, fetch the meal details first
      if (createFromMeal) {
        const mealResponse = await fetch(`/api/meals/${createFromMeal}`)
        if (!mealResponse.ok) throw new Error('Failed to fetch meal')
        const meal = await mealResponse.json()

        const response = await fetch('/api/meals/templates', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: templateName,
            mealType: meal.mealType,
            foodItems: meal.foodItems.map((item: any) => ({
              foodItemId: item.foodItemId,
              quantity: item.quantity
            }))
          })
        })

        if (!response.ok) throw new Error('Failed to create template')
        
        toast({
          title: 'Success',
          description: 'Template created successfully'
        })
        
        fetchTemplates()
        setShowCreateDialog(false)
        setTemplateName('')
        setCreateFromMeal(null)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create template',
        variant: 'destructive'
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleToggleFavorite = async (template: MealTemplate) => {
    try {
      const response = await fetch(`/api/meals/templates/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isFavorite: !template.isFavorite })
      })

      if (!response.ok) throw new Error('Failed to update template')

      setTemplates(prev => prev.map(t => 
        t.id === template.id ? { ...t, isFavorite: !t.isFavorite } : t
      ))

      toast({
        title: 'Success',
        description: template.isFavorite ? 'Removed from favorites' : 'Added to favorites'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update template',
        variant: 'destructive'
      })
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/meals/templates/${templateId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete template')

      setTemplates(prev => prev.filter(t => t.id !== templateId))
      toast({
        title: 'Success',
        description: 'Template deleted successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete template',
        variant: 'destructive'
      })
    }
  }

  const handleUseTemplate = async (template: MealTemplate) => {
    try {
      const response = await fetch('/api/meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mealType: template.mealType,
          foodItems: template.foodItems.map(item => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity
          })),
          loggedAt: new Date().toISOString(),
          notes: `Created from template: ${template.name}`
        })
      })

      if (!response.ok) throw new Error('Failed to create meal')

      toast({
        title: 'Success',
        description: 'Meal logged from template'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create meal from template',
        variant: 'destructive'
      })
    }
  }

  const calculateTemplateNutrition = (template: MealTemplate) => {
    return template.foodItems.reduce((acc, item) => ({
      calories: acc.calories + (item.foodItem.calories * item.quantity),
      protein: acc.protein + (item.foodItem.protein * item.quantity),
      carbs: acc.carbs + (item.foodItem.carbs * item.quantity),
      fat: acc.fat + (item.foodItem.fat * item.quantity)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Loading templates...
          </div>
        </CardContent>
      </Card>
    )
  }

  const favoriteTemplates = templates.filter(t => t.isFavorite)
  const regularTemplates = templates.filter(t => !t.isFavorite)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Meal Templates</h2>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      {favoriteTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            Favorites
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                nutrition={calculateTemplateNutrition(template)}
                onUse={() => handleUseTemplate(template)}
                onToggleFavorite={() => handleToggleFavorite(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
                onViewDetails={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {regularTemplates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">All Templates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regularTemplates.map(template => (
              <TemplateCard
                key={template.id}
                template={template}
                nutrition={calculateTemplateNutrition(template)}
                onUse={() => handleUseTemplate(template)}
                onToggleFavorite={() => handleToggleFavorite(template)}
                onDelete={() => handleDeleteTemplate(template.id)}
                onViewDetails={() => setSelectedTemplate(template)}
              />
            ))}
          </div>
        </div>
      )}

      {templates.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              No templates yet. Create your first template to quickly log frequent meals!
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Meal Template</DialogTitle>
            <DialogDescription>
              Save a meal as a template for quick logging
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Morning Protein Shake"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTemplate} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          {selectedTemplate && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={MEAL_TYPE_COLORS[selectedTemplate.mealType as keyof typeof MEAL_TYPE_COLORS]}>
                  {selectedTemplate.mealType}
                </Badge>
                {selectedTemplate.isFavorite && (
                  <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                )}
              </div>
              
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Calories:</span>
                  <div className="font-medium">
                    {Math.round(calculateTemplateNutrition(selectedTemplate).calories)}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Protein:</span>
                  <div className="font-medium">
                    {Math.round(calculateTemplateNutrition(selectedTemplate).protein)}g
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Carbs:</span>
                  <div className="font-medium">
                    {Math.round(calculateTemplateNutrition(selectedTemplate).carbs)}g
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Fat:</span>
                  <div className="font-medium">
                    {Math.round(calculateTemplateNutrition(selectedTemplate).fat)}g
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Food Items</h4>
                <div className="space-y-2">
                  {selectedTemplate.foodItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-2 border-b">
                      <div>
                        <div className="font-medium">{item.foodItem.name}</div>
                        <div className="text-sm text-muted-foreground">
                          Quantity: {item.quantity}
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div>{Math.round(item.foodItem.calories * item.quantity)} cal</div>
                        <div className="text-muted-foreground">
                          P: {Math.round(item.foodItem.protein * item.quantity)}g
                          {' '}C: {Math.round(item.foodItem.carbs * item.quantity)}g
                          {' '}F: {Math.round(item.foodItem.fat * item.quantity)}g
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>
              Close
            </Button>
            <Button onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)}>
              <Clock className="mr-2 h-4 w-4" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function TemplateCard({ 
  template, 
  nutrition,
  onUse, 
  onToggleFavorite, 
  onDelete,
  onViewDetails
}: {
  template: MealTemplate
  nutrition: { calories: number; protein: number; carbs: number; fat: number }
  onUse: () => void
  onToggleFavorite: () => void
  onDelete: () => void
  onViewDetails: () => void
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{template.name}</CardTitle>
            <Badge 
              className={`mt-1 ${MEAL_TYPE_COLORS[template.mealType as keyof typeof MEAL_TYPE_COLORS]}`}
            >
              {template.mealType}
            </Badge>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={onToggleFavorite}
          >
            {template.isFavorite ? (
              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">Calories:</span>
              <div className="font-medium">{Math.round(nutrition.calories)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Protein:</span>
              <div className="font-medium">{Math.round(nutrition.protein)}g</div>
            </div>
            <div>
              <span className="text-muted-foreground">Carbs:</span>
              <div className="font-medium">{Math.round(nutrition.carbs)}g</div>
            </div>
            <div>
              <span className="text-muted-foreground">Fat:</span>
              <div className="font-medium">{Math.round(nutrition.fat)}g</div>
            </div>
          </div>
          
          <div className="text-sm text-muted-foreground">
            {template.foodItems.length} food item{template.foodItems.length !== 1 ? 's' : ''}
          </div>

          <div className="flex gap-2">
            <Button size="sm" className="flex-1" onClick={onUse}>
              <Clock className="mr-1 h-3 w-3" />
              Use
            </Button>
            <Button size="sm" variant="outline" onClick={onViewDetails}>
              View
            </Button>
            <Button size="sm" variant="ghost" onClick={onDelete}>
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}