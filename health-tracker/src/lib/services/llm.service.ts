import OpenAI from 'openai'
import { 
  FoodExtractionResponse, 
  ExtractFoodOptions, 
  LLMProviderConfig,
  FoodExtractionResponseSchema,
  foodExtractionSchema 
} from '@/types/llm.types'

const SYSTEM_PROMPT = `You are a nutrition data extraction assistant. Extract structured nutritional information from food descriptions.

Rules:
1. Parse the description to identify individual food items
2. Estimate portion sizes if not specified (use common serving sizes)
3. Provide accurate nutritional data per item based on standard nutritional databases
4. If uncertain about exact values, provide reasonable estimates based on similar foods
5. Support multilingual input (English, Chinese, etc.)
6. Return ONLY valid JSON without any markdown formatting or code blocks
7. Calculate total nutrition summary with macro percentages
8. Add warnings for estimated values or uncertain items
9. For mixed dishes, break down into components when possible

Important: 
- Calories should be realistic (e.g., chicken breast 200g ≈ 330 calories)
- Protein: 4 cal/g, Carbs: 4 cal/g, Fat: 9 cal/g
- Ensure macro percentages add up to 100%`

const EXTRACTION_PROMPT_TEMPLATE = `Extract nutritional information from this food description:

Description: {description}
Meal Type: {mealType}
Language: {language}

Please identify all food items, their quantities, and nutritional values. If portions are not specified, use typical serving sizes. Provide confidence scores for each item and overall extraction.

Return the response in this exact JSON structure:
{
  "success": true,
  "confidence": 0.85,
  "items": [
    {
      "name": "food name",
      "nameLocal": "local name if applicable",
      "quantity": 100,
      "unit": "g",
      "category": "protein",
      "nutrition": {
        "calories": 165,
        "protein": 31,
        "carbs": 0,
        "fat": 3.6,
        "fiber": 0,
        "sugar": 0,
        "sodium": 74
      },
      "confidence": 0.9
    }
  ],
  "totalNutrition": {
    "totalCalories": 165,
    "totalProtein": 31,
    "totalCarbs": 0,
    "totalFat": 3.6,
    "totalFiber": 0,
    "totalSugar": 0,
    "totalSodium": 74,
    "macroBreakdown": {
      "proteinPercentage": 75,
      "carbsPercentage": 0,
      "fatPercentage": 25
    }
  },
  "warnings": ["Portion sizes estimated based on typical servings"]
}`

export class LLMService {
  private client: OpenAI
  private provider: string
  private model: string
  private maxRetries: number = 2
  
  constructor(config?: Partial<LLMProviderConfig>) {
    const providerConfig = this.getProviderConfig(config)
    
    this.client = new OpenAI({
      apiKey: providerConfig.apiKey,
      baseURL: providerConfig.baseUrl,
      defaultHeaders: providerConfig.headers,
      dangerouslyAllowBrowser: false // Only for server-side usage
    })
    
    this.provider = providerConfig.provider
    this.model = providerConfig.model
  }
  
  async extractFoodData(
    description: string, 
    options?: ExtractFoodOptions
  ): Promise<FoodExtractionResponse> {
    try {
      // Build the prompt
      const prompt = this.buildPrompt(description, options)
      
      // Make the API call with retries
      let lastError: any
      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const startTime = Date.now()
          
          const completion = await this.client.chat.completions.create({
            model: this.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            response_format: this.supportsJsonMode() 
              ? { type: 'json_object' } 
              : undefined,
            temperature: 0.3, // Lower for more consistent extraction
            max_tokens: 2000,
            ...(this.provider === 'gemini' && {
              response_schema: foodExtractionSchema // Gemini structured output
            })
          })
          
          const responseContent = completion.choices[0]?.message?.content
          if (!responseContent) {
            throw new Error('Empty response from LLM')
          }
          
          // Parse and validate the response
          const parsedResponse = this.parseJsonResponse(responseContent)
          const validatedResponse = this.validateResponse(parsedResponse)
          
          // Add metadata
          validatedResponse.metadata = {
            provider: this.provider,
            model: this.model,
            processingTime: Date.now() - startTime,
            tokensUsed: completion.usage?.total_tokens
          }
          
          return validatedResponse
          
        } catch (error: any) {
          lastError = error
          
          // Don't retry on certain errors
          if (error.status === 401 || error.status === 403) {
            break
          }
          
          // Wait before retry
          if (attempt < this.maxRetries) {
            await this.delay(1000 * (attempt + 1))
          }
        }
      }
      
      // All retries failed
      return this.handleError(lastError)
      
    } catch (error) {
      return this.handleError(error)
    }
  }
  
  private buildPrompt(description: string, options?: ExtractFoodOptions): string {
    const mealType = options?.mealType || 'not specified'
    const language = options?.language || 'auto-detect'
    
    return EXTRACTION_PROMPT_TEMPLATE
      .replace('{description}', description)
      .replace('{mealType}', mealType)
      .replace('{language}', language)
  }
  
  private parseJsonResponse(content: string): any {
    // Remove markdown code blocks if present
    const cleaned = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()
    
    try {
      return JSON.parse(cleaned)
    } catch (error) {
      console.error('Failed to parse JSON response:', cleaned)
      throw new Error('Invalid JSON response from LLM')
    }
  }
  
  private validateResponse(response: any): FoodExtractionResponse {
    try {
      // Validate with Zod schema
      const validated = FoodExtractionResponseSchema.parse(response)
      
      // Additional validation: ensure totals match items
      const calculatedTotals = this.calculateTotals(validated.items)
      
      // Update totals if there's a mismatch
      if (Math.abs(validated.totalNutrition.totalCalories - calculatedTotals.totalCalories) > 10) {
        validated.totalNutrition = calculatedTotals
      }
      
      return validated
      
    } catch (error) {
      console.error('Response validation failed:', error)
      
      // Try to salvage what we can
      if (response?.items && Array.isArray(response.items)) {
        return {
          success: false,
          confidence: 0.5,
          items: response.items.filter((item: any) => item?.name && item?.nutrition),
          totalNutrition: this.calculateTotals(response.items),
          warnings: ['Response validation failed. Data may be incomplete.']
        }
      }
      
      throw error
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
    
    // Ensure percentages add up to 100
    const percentageSum = macroBreakdown.proteinPercentage + 
                         macroBreakdown.carbsPercentage + 
                         macroBreakdown.fatPercentage
    
    if (percentageSum !== 100 && percentageSum > 0) {
      // Adjust the largest percentage to make sum = 100
      const diff = 100 - percentageSum
      if (macroBreakdown.carbsPercentage >= macroBreakdown.proteinPercentage && 
          macroBreakdown.carbsPercentage >= macroBreakdown.fatPercentage) {
        macroBreakdown.carbsPercentage += diff
      } else if (macroBreakdown.proteinPercentage >= macroBreakdown.fatPercentage) {
        macroBreakdown.proteinPercentage += diff
      } else {
        macroBreakdown.fatPercentage += diff
      }
    }
    
    return {
      ...totals,
      calories: totals.totalCalories, // For compatibility
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
    console.error('LLM extraction error:', error)
    
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
    
    if (error?.status === 429) {
      return {
        success: false,
        confidence: 0,
        items: [],
        totalNutrition: emptyNutrition,
        warnings: ['Rate limit exceeded. Please try again later.']
      }
    }
    
    if (error?.status === 401 || error?.status === 403) {
      return {
        success: false,
        confidence: 0,
        items: [],
        totalNutrition: emptyNutrition,
        warnings: ['API authentication failed. Please check configuration.']
      }
    }
    
    if (error?.message?.includes('timeout')) {
      return {
        success: false,
        confidence: 0,
        items: [],
        totalNutrition: emptyNutrition,
        warnings: ['Request timed out. Please try again.']
      }
    }
    
    // Generic fallback
    return {
      success: false,
      confidence: 0,
      items: [],
      totalNutrition: emptyNutrition,
      warnings: ['Failed to extract food data. Please input manually.']
    }
  }
  
  private getProviderConfig(customConfig?: Partial<LLMProviderConfig>): LLMProviderConfig {
    const provider = customConfig?.provider || 
                    process.env.LLM_PROVIDER as any || 
                    'gemini'
    
    if (provider === 'gemini') {
      return {
        provider: 'gemini',
        apiKey: customConfig?.apiKey || process.env.GEMINI_API_KEY || '',
        baseUrl: customConfig?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/',
        model: customConfig?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        headers: customConfig?.headers || {},
        maxTokens: customConfig?.maxTokens || 2000,
        temperature: customConfig?.temperature || 0.3
      }
    }
    
    if (provider === 'openrouter') {
      return {
        provider: 'openrouter',
        apiKey: customConfig?.apiKey || process.env.OPENROUTER_API_KEY || '',
        baseUrl: customConfig?.baseUrl || 'https://openrouter.ai/api/v1/',
        model: customConfig?.model || process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash',
        headers: customConfig?.headers || {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Health Tracker'
        },
        maxTokens: customConfig?.maxTokens || 2000,
        temperature: customConfig?.temperature || 0.3
      }
    }
    
    // Default to OpenAI
    return {
      provider: 'openai',
      apiKey: customConfig?.apiKey || process.env.OPENAI_API_KEY || '',
      baseUrl: customConfig?.baseUrl || 'https://api.openai.com/v1/',
      model: customConfig?.model || process.env.OPENAI_MODEL || 'gpt-4o-mini',
      headers: customConfig?.headers || {},
      maxTokens: customConfig?.maxTokens || 2000,
      temperature: customConfig?.temperature || 0.3
    }
  }
  
  private supportsJsonMode(): boolean {
    // Check if the provider/model supports JSON mode
    if (this.provider === 'gemini') return true
    if (this.provider === 'openai' && this.model.includes('gpt-4')) return true
    if (this.provider === 'openrouter') return true // Most models on OpenRouter support it
    return false
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // Utility method to check if API is configured
  static isConfigured(): boolean {
    return !!(
      process.env.GEMINI_API_KEY || 
      process.env.OPENROUTER_API_KEY || 
      process.env.OPENAI_API_KEY
    )
  }
  
  // Get available providers
  static getAvailableProviders(): string[] {
    const providers: string[] = []
    if (process.env.GEMINI_API_KEY) providers.push('gemini')
    if (process.env.OPENROUTER_API_KEY) providers.push('openrouter')
    if (process.env.OPENAI_API_KEY) providers.push('openai')
    return providers
  }
}

// Singleton instance for reuse
let llmServiceInstance: LLMService | null = null

export function getLLMService(config?: Partial<LLMProviderConfig>): LLMService {
  if (!llmServiceInstance || config) {
    llmServiceInstance = new LLMService(config)
  }
  return llmServiceInstance
}