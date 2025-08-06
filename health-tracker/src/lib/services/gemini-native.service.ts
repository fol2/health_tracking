import { 
  FoodExtractionResponse, 
  ExtractFoodOptions,
  FoodExtractionResponseSchema 
} from '@/types/llm.types'

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta'

const SYSTEM_INSTRUCTION = `You are an expert nutrition analyzer. Extract nutritional data from food descriptions in ANY language.

CRITICAL: Parse ALL food items, especially when separated by "再加" (and also), "and", "with", "plus".

Return a JSON object with this structure:
{
  "success": true,
  "confidence": 0.9,
  "items": [
    {
      "name": "english name",
      "nameLocal": "original if non-English",
      "quantity": number,
      "unit": "g/ml",
      "category": "protein/carbs/vegetables/beverages/etc",
      "nutrition": {
        "calories": number,
        "protein": number,
        "carbs": number,
        "fat": number,
        "fiber": number,
        "sugar": number,
        "sodium": number
      },
      "confidence": 0.9
    }
  ]
}

DEFAULT PORTIONS:
- Steak/beef: 200g
- Chicken/fish: 150g
- Vegetables: 100g
- Wine: 150ml/glass
- "少少"/"a bit": 50g/50ml`

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string
      }>
      role: string
    }
    finishReason: string
    index: number
  }>
  usageMetadata?: {
    promptTokenCount: number
    candidatesTokenCount: number
    totalTokenCount: number
    thoughtsTokenCount?: number
  }
}

export class GeminiNativeService {
  private apiKey: string
  private model: string = 'gemini-2.5-flash'
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || ''
    if (!this.apiKey) {
      throw new Error('GEMINI_API_KEY is required')
    }
  }
  
  async extractFoodData(
    description: string,
    options?: ExtractFoodOptions
  ): Promise<FoodExtractionResponse> {
    try {
      console.log('[Gemini Native] Starting extraction for:', description)
      
      // Build the request
      const requestBody = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${SYSTEM_INSTRUCTION}\n\nAnalyze this food description: "${description}"`
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 8192,  // Native Gemini supports much higher limits
          responseMimeType: 'application/json',  // Request JSON response
          responseSchema: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              confidence: { type: 'number' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    nameLocal: { type: 'string' },
                    quantity: { type: 'number' },
                    unit: { type: 'string' },
                    category: { type: 'string' },
                    nutrition: {
                      type: 'object',
                      properties: {
                        calories: { type: 'number' },
                        protein: { type: 'number' },
                        carbs: { type: 'number' },
                        fat: { type: 'number' },
                        fiber: { type: 'number' },
                        sugar: { type: 'number' },
                        sodium: { type: 'number' }
                      },
                      required: ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sugar', 'sodium']
                    },
                    confidence: { type: 'number' }
                  },
                  required: ['name', 'quantity', 'unit', 'category', 'nutrition']
                }
              }
            },
            required: ['success', 'confidence', 'items']
          },
          // Configure thinking for complex extraction
          thinkingConfig: {
            thinkingBudget: 8192,  // Use thinking tokens for complex parsing
            includeThoughts: false  // We don't need to see the thoughts
          }
        }
      }
      
      console.log('[Gemini Native] Request config:', {
        model: this.model,
        maxOutputTokens: 8192,
        thinkingBudget: 8192,
        hasResponseSchema: true
      })
      
      // Make the API call
      const response = await fetch(
        `${GEMINI_API_BASE}/models/${this.model}:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.apiKey
          },
          body: JSON.stringify(requestBody)
        }
      )
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('[Gemini Native] API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        })
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`)
      }
      
      const data: GeminiResponse = await response.json()
      
      console.log('[Gemini Native] Response metadata:', {
        hasResponse: !!data,
        candidatesCount: data.candidates?.length,
        finishReason: data.candidates?.[0]?.finishReason,
        usage: data.usageMetadata
      })
      
      // Extract the text response
      const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text
      
      if (!textResponse) {
        console.error('[Gemini Native] No text in response:', data)
        throw new Error('No response from Gemini')
      }
      
      console.log('[Gemini Native] Raw response (first 500 chars):', textResponse.substring(0, 500))
      
      // Parse the JSON response
      const parsedResponse = JSON.parse(textResponse)
      
      // Calculate totals if missing
      if (!parsedResponse.totalNutrition) {
        parsedResponse.totalNutrition = this.calculateTotals(parsedResponse.items || [])
      }
      
      // Validate with schema
      const validated = FoodExtractionResponseSchema.parse(parsedResponse)
      
      // Add metadata
      validated.metadata = {
        provider: 'gemini-native',
        model: this.model,
        processingTime: 0,
        tokensUsed: data.usageMetadata?.totalTokenCount,
        thoughtsTokenCount: data.usageMetadata?.thoughtsTokenCount
      }
      
      return validated
      
    } catch (error: any) {
      console.error('[Gemini Native] Error:', error)
      return this.handleError(error)
    }
  }
  
  private calculateTotals(items: any[]): any {
    const totals = items.reduce((acc, item) => {
      const nutrition = item.nutrition || {}
      return {
        totalCalories: acc.totalCalories + (nutrition.calories || 0),
        totalProtein: acc.totalProtein + (nutrition.protein || 0),
        totalCarbs: acc.totalCarbs + (nutrition.carbs || 0),
        totalFat: acc.totalFat + (nutrition.fat || 0),
        totalFiber: acc.totalFiber + (nutrition.fiber || 0),
        totalSugar: acc.totalSugar + (nutrition.sugar || 0),
        totalSodium: acc.totalSodium + (nutrition.sodium || 0)
      }
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0
    })
    
    // Calculate macro percentages
    const totalMacroCalories = 
      (totals.totalProtein * 4) + 
      (totals.totalCarbs * 4) + 
      (totals.totalFat * 9)
    
    const macroBreakdown = {
      proteinPercentage: totalMacroCalories > 0 
        ? Math.round((totals.totalProtein * 4 / totalMacroCalories) * 100) 
        : 0,
      carbsPercentage: totalMacroCalories > 0 
        ? Math.round((totals.totalCarbs * 4 / totalMacroCalories) * 100) 
        : 0,
      fatPercentage: totalMacroCalories > 0 
        ? Math.round((totals.totalFat * 9 / totalMacroCalories) * 100) 
        : 0
    }
    
    return {
      ...totals,
      calories: totals.totalCalories,
      protein: totals.totalProtein,
      carbs: totals.totalCarbs,
      fat: totals.totalFat,
      fiber: totals.totalFiber,
      sugar: totals.totalSugar,
      sodium: totals.totalSodium,
      macroBreakdown
    }
  }
  
  private handleError(error: any): FoodExtractionResponse {
    const emptyNutrition = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      totalSugar: 0,
      totalSodium: 0,
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      macroBreakdown: {
        proteinPercentage: 0,
        carbsPercentage: 0,
        fatPercentage: 0
      }
    }
    
    return {
      success: false,
      confidence: 0,
      items: [],
      totalNutrition: emptyNutrition,
      warnings: ['Failed to extract food data. Please input manually.']
    }
  }
}

// Singleton instance
let geminiServiceInstance: GeminiNativeService | null = null

export function getGeminiNativeService(): GeminiNativeService {
  if (!geminiServiceInstance) {
    geminiServiceInstance = new GeminiNativeService()
  }
  return geminiServiceInstance
}