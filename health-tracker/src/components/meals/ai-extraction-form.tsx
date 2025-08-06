'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Sparkles, Loader2, AlertCircle, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface ExtractedFood {
  name: string
  nameLocal?: string
  quantity: number
  unit: string
  category: string
  nutrition: {
    calories: number
    protein: number
    carbs: number
    fat: number
    fiber: number
    sugar: number
    sodium: number
  }
  confidence: number
}

interface AIExtractionFormProps {
  onExtracted?: (items: ExtractedFood[]) => void
  onCancel?: () => void
}

export function AIExtractionForm({ onExtracted, onCancel }: AIExtractionFormProps) {
  const [description, setDescription] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedItems, setExtractedItems] = useState<ExtractedFood[]>([])
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
        setExtractedItems(data.items)
        toast({
          title: 'Success!',
          description: `Extracted ${data.items.length} food item(s)`
        })
      } else {
        throw new Error(data.warnings?.[0] || 'No food items found')
      }
    } catch (error) {
      console.error('Extraction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract food data')
      toast({
        title: 'Extraction Failed',
        description: 'Please try again or input manually',
        variant: 'destructive'
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleConfirm = () => {
    if (extractedItems.length > 0 && onExtracted) {
      onExtracted(extractedItems)
      // Reset form
      setDescription('')
      setExtractedItems([])
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          AI Food Extraction
        </CardTitle>
        <CardDescription>
          Describe what you ate in any language and let AI extract the nutritional information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Textarea
            placeholder="E.g., 'I had a chicken sandwich with fries and a diet coke' or '今天吃了雞胸肉配飯和西蘭花'"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
            disabled={isExtracting}
          />
          <p className="text-sm text-muted-foreground mt-2">
            Tip: Be specific about portions (e.g., "200g chicken" or "large apple")
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {extractedItems.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Extracted Items:</h4>
            <div className="space-y-2">
              {extractedItems.map((item, index) => (
                <div key={index} className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">
                      {item.name}
                      {item.nameLocal && (
                        <span className="text-sm text-muted-foreground ml-2">
                          ({item.nameLocal})
                        </span>
                      )}
                    </div>
                    <span className="text-sm">
                      {item.quantity}{item.unit}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Calories:</span>{' '}
                      {item.nutrition.calories}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Protein:</span>{' '}
                      {item.nutrition.protein}g
                    </div>
                    <div>
                      <span className="text-muted-foreground">Carbs:</span>{' '}
                      {item.nutrition.carbs}g
                    </div>
                    <div>
                      <span className="text-muted-foreground">Fat:</span>{' '}
                      {item.nutrition.fat}g
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {extractedItems.length === 0 ? (
            <>
              <Button
                onClick={handleExtract}
                disabled={isExtracting || !description.trim()}
                className="flex-1"
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
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
            </>
          ) : (
            <>
              <Button onClick={handleConfirm} className="flex-1">
                <Check className="mr-2 h-4 w-4" />
                Add to Meal Log
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setExtractedItems([])
                  setDescription('')
                }}
              >
                Try Again
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}