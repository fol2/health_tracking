'use client'

import { useState } from 'react'
import { AIFoodInput } from '@/components/meals/ai-food-input'
import { FoodItem } from '@/types/llm.types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AIFoodExtractionExample() {
  const [savedItems, setSavedItems] = useState<FoodItem[]>([])
  const [currentMealType, setCurrentMealType] = useState<'breakfast' | 'lunch' | 'dinner' | 'snack'>('lunch')

  const handleExtract = (items: FoodItem[]) => {
    console.log('Extracted items:', items)
  }

  const handleSave = async (items: FoodItem[]) => {
    // Here you would normally save to database
    console.log('Saving items:', items)
    
    // For demo, just add to local state
    setSavedItems(prev => [...prev, ...items])
    
    // In real implementation, you would call your meal service
    // await MealService.createMeal({
    //   type: currentMealType,
    //   items: items,
    //   userId: session.user.id
    // })
    
    return new Promise<void>(resolve => {
      setTimeout(resolve, 1000) // Simulate API call
    })
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <Link href="/meals">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Meals
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>AI-Powered Food Extraction Demo</CardTitle>
          <CardDescription>
            Try describing your meals naturally and watch as AI extracts nutritional information automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-sm">Example Descriptions</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Try these examples:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>"Grilled chicken breast 200g with steamed broccoli"</li>
                    <li>"2 scrambled eggs with 2 slices of whole wheat toast"</li>
                    <li>"Caesar salad with grilled shrimp and light dressing"</li>
                    <li>"一碗白飯，清蒸魚，炒菜心" (Chinese food)</li>
                    <li>"Medium pepperoni pizza, 3 slices"</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <h3 className="font-semibold text-sm">How It Works</h3>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Describe your meal in natural language</li>
                    <li>AI identifies individual food items</li>
                    <li>Estimates portions if not specified</li>
                    <li>Extracts nutritional data for each item</li>
                    <li>Review and edit before saving</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={currentMealType} onValueChange={(v) => setCurrentMealType(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
          <TabsTrigger value="lunch">Lunch</TabsTrigger>
          <TabsTrigger value="dinner">Dinner</TabsTrigger>
          <TabsTrigger value="snack">Snack</TabsTrigger>
        </TabsList>

        <TabsContent value={currentMealType} className="mt-4">
          <AIFoodInput
            mealType={currentMealType}
            onExtract={handleExtract}
            onSave={handleSave}
          />
        </TabsContent>
      </Tabs>

      {savedItems.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Saved Items (Demo)</CardTitle>
            <CardDescription>
              These items would normally be saved to your meal history
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {savedItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                  <span className="font-medium">{item.name}</span>
                  <div className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit} • {item.nutrition.calories} cal
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-primary/10 rounded">
              <div className="flex justify-between font-semibold">
                <span>Total Calories</span>
                <span>
                  {savedItems.reduce((sum, item) => sum + item.nutrition.calories, 0)} cal
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Integration Guide</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">1. Set up API Keys</h3>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`# In your .env.local file
GEMINI_API_KEY=your_api_key_here
LLM_PROVIDER=gemini
ENABLE_AI_FOOD_EXTRACTION=true`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">2. Import the Component</h3>
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{`import { AIFoodInput } from '@/components/meals/ai-food-input'

function MealPage() {
  const handleSave = async (items) => {
    // Save to database
    await MealService.createMeal({ items })
  }
  
  return (
    <AIFoodInput 
      mealType="lunch"
      onSave={handleSave}
    />
  )
}`}
            </pre>
          </div>

          <div>
            <h3 className="font-semibold mb-2">3. Available Props</h3>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li><code>mealType</code>: Type of meal (breakfast, lunch, dinner, snack)</li>
              <li><code>onExtract</code>: Callback when items are extracted</li>
              <li><code>onSave</code>: Async callback to save items</li>
              <li><code>className</code>: Additional CSS classes</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}