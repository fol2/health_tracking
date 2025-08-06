'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Sparkles, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Edit2, 
  Trash2,
  Info,
  Plus,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { FoodItem, FoodExtractionResponse } from '@/types/llm.types'
import { cn } from '@/lib/utils'

interface AIFoodInputProps {
  onExtract: (items: FoodItem[]) => void
  onSave?: (items: FoodItem[]) => Promise<void>
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  className?: string
}

export function AIFoodInput({ onExtract, onSave, mealType, className }: AIFoodInputProps) {
  const [description, setDescription] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedItems, setExtractedItems] = useState<FoodItem[]>([])
  const [response, setResponse] = useState<FoodExtractionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<any>(null)

  // Check service status on mount
  useState(() => {
    fetch('/api/meals/extract')
      .then(res => res.json())
      .then(data => setServiceStatus(data))
      .catch(console.error)
  })

  const handleExtract = useCallback(async () => {
    if (!description.trim()) {
      setError('Please describe what you ate')
      return
    }

    setIsExtracting(true)
    setError(null)
    setExtractedItems([])
    setResponse(null)

    try {
      const res = await fetch('/api/meals/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          mealType,
          language: 'auto'
        })
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to extract (${res.status})`)
      }

      const data: FoodExtractionResponse = await res.json()
      setResponse(data)

      if (data.success && data.items.length > 0) {
        setExtractedItems(data.items)
        onExtract(data.items)
      } else {
        setError(data.warnings?.[0] || 'No food items could be extracted')
      }
    } catch (err) {
      console.error('Extraction error:', err)
      setError(err instanceof Error ? err.message : 'Failed to extract food data')
    } finally {
      setIsExtracting(false)
    }
  }, [description, mealType, onExtract])

  const handleEditItem = useCallback((index: number, field: keyof FoodItem, value: any) => {
    setExtractedItems(prev => {
      const updated = [...prev]
      updated[index] = {
        ...updated[index],
        [field]: value
      }
      return updated
    })
  }, [])

  const handleDeleteItem = useCallback((index: number) => {
    setExtractedItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleAddManualItem = useCallback(() => {
    const newItem: FoodItem = {
      name: '',
      quantity: 100,
      unit: 'g',
      category: 'other',
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
      },
      confidence: 1,
      source: 'manual'
    }
    setExtractedItems(prev => [...prev, newItem])
    setEditingIndex(extractedItems.length)
  }, [extractedItems.length])

  const handleSave = useCallback(async () => {
    if (onSave && extractedItems.length > 0) {
      try {
        await onSave(extractedItems)
        setDescription('')
        setExtractedItems([])
        setResponse(null)
      } catch (err) {
        setError('Failed to save items')
      }
    }
  }, [extractedItems, onSave])

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-500">High</Badge>
    } else if (confidence >= 0.5) {
      return <Badge className="bg-yellow-500">Medium</Badge>
    } else {
      return <Badge className="bg-red-500">Low</Badge>
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      protein: 'bg-red-100 text-red-800',
      carbs: 'bg-blue-100 text-blue-800',
      vegetables: 'bg-green-100 text-green-800',
      fruits: 'bg-orange-100 text-orange-800',
      dairy: 'bg-purple-100 text-purple-800',
      fats: 'bg-yellow-100 text-yellow-800',
      beverages: 'bg-cyan-100 text-cyan-800',
      snacks: 'bg-pink-100 text-pink-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || colors.other
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI Food Extraction
          </CardTitle>
          <CardDescription>
            Describe what you ate and let AI extract the nutritional information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="food-description">Food Description</Label>
            <Textarea
              id="food-description"
              placeholder="E.g., I had a grilled chicken sandwich with lettuce and mayo, and a medium coke..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
              disabled={isExtracting}
            />
            <p className="text-sm text-muted-foreground">
              Tip: Be specific about portions (e.g., "200g chicken" or "large apple")
            </p>
          </div>

          {/* Service Status */}
          {serviceStatus && (
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {serviceStatus.status === 'ready' ? (
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                )}
                <span>
                  {serviceStatus.status === 'ready' 
                    ? `Ready (${serviceStatus.usage.remaining}/${serviceStatus.usage.dailyLimit} uses left today)`
                    : 'Service not configured'}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          )}

          {showDetails && serviceStatus && (
            <div className="rounded-lg bg-muted p-3 text-sm space-y-1">
              <p>Provider: {serviceStatus.currentProvider}</p>
              <p>Model: {serviceStatus.currentModel}</p>
              <p>Cache: {serviceStatus.features.cacheEnabled ? 'Enabled' : 'Disabled'}</p>
            </div>
          )}

          <Button
            onClick={handleExtract}
            disabled={isExtracting || !description.trim() || serviceStatus?.status !== 'ready'}
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
                Extract Nutrition Data
              </>
            )}
          </Button>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Response Summary */}
      {response && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Extraction Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Confidence</span>
              {getConfidenceBadge(response.confidence)}
            </div>

            {response.totalNutrition && (
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Total Calories</p>
                  <p className="text-2xl font-bold">{response.totalNutrition.totalCalories}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Protein</span>
                    <span>{response.totalNutrition.totalProtein}g ({response.totalNutrition.macroBreakdown?.proteinPercentage}%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Carbs</span>
                    <span>{response.totalNutrition.totalCarbs}g ({response.totalNutrition.macroBreakdown?.carbsPercentage}%)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Fat</span>
                    <span>{response.totalNutrition.totalFat}g ({response.totalNutrition.macroBreakdown?.fatPercentage}%)</span>
                  </div>
                </div>
              </div>
            )}

            {response.warnings && response.warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {response.warnings.join('. ')}
                </AlertDescription>
              </Alert>
            )}

            {response.metadata?.cached && (
              <p className="text-xs text-muted-foreground">
                ⚡ Result from cache
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Extracted Items */}
      {extractedItems.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Food Items ({extractedItems.length})</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddManualItem}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {extractedItems.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    {editingIndex === index ? (
                      <Input
                        value={item.name}
                        onChange={(e) => handleEditItem(index, 'name', e.target.value)}
                        placeholder="Food name"
                        className="font-medium"
                      />
                    ) : (
                      <h4 className="font-medium">{item.name || 'Unnamed item'}</h4>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs', getCategoryColor(item.category))}>
                        {item.category}
                      </Badge>
                      {item.confidence < 1 && getConfidenceBadge(item.confidence)}
                      {item.source === 'database' && (
                        <Badge variant="secondary" className="text-xs">
                          From database
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {editingIndex === index ? (
                        <>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleEditItem(index, 'quantity', parseFloat(e.target.value))}
                            className="w-20"
                          />
                          <select
                            value={item.unit}
                            onChange={(e) => handleEditItem(index, 'unit', e.target.value)}
                            className="px-2 py-1 border rounded"
                          >
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                            <option value="oz">oz</option>
                            <option value="ml">ml</option>
                            <option value="cup">cup</option>
                            <option value="piece">piece</option>
                            <option value="serving">serving</option>
                          </select>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Calories: </span>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={item.nutrition.calories}
                            onChange={(e) => handleEditItem(index, 'nutrition', {
                              ...item.nutrition,
                              calories: parseFloat(e.target.value)
                            })}
                            className="w-16 h-6 text-xs"
                          />
                        ) : (
                          <span className="font-medium">{item.nutrition.calories}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Protein: </span>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={item.nutrition.protein}
                            onChange={(e) => handleEditItem(index, 'nutrition', {
                              ...item.nutrition,
                              protein: parseFloat(e.target.value)
                            })}
                            className="w-16 h-6 text-xs"
                          />
                        ) : (
                          <span>{item.nutrition.protein}g</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Carbs: </span>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={item.nutrition.carbs}
                            onChange={(e) => handleEditItem(index, 'nutrition', {
                              ...item.nutrition,
                              carbs: parseFloat(e.target.value)
                            })}
                            className="w-16 h-6 text-xs"
                          />
                        ) : (
                          <span>{item.nutrition.carbs}g</span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fat: </span>
                        {editingIndex === index ? (
                          <Input
                            type="number"
                            value={item.nutrition.fat}
                            onChange={(e) => handleEditItem(index, 'nutrition', {
                              ...item.nutrition,
                              fat: parseFloat(e.target.value)
                            })}
                            className="w-16 h-6 text-xs"
                          />
                        ) : (
                          <span>{item.nutrition.fat}g</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditingIndex(editingIndex === index ? null : index)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteItem(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {onSave && (
              <Button
                onClick={handleSave}
                className="w-full"
                disabled={extractedItems.length === 0}
              >
                Save {extractedItems.length} Item{extractedItems.length !== 1 ? 's' : ''}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}