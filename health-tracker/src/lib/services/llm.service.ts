import OpenAI from 'openai'
import { 
  FoodExtractionResponse, 
  ExtractFoodOptions, 
  LLMProviderConfig,
  FoodExtractionResponseSchema,
  foodExtractionSchema 
} from '@/types/llm.types'
import { LLM_CONFIG } from '@/lib/config/llm.config'
import { getGeminiNativeService } from './gemini-native.service'

const SYSTEM_PROMPT = `Extract nutritional data from food descriptions in ANY language. Translate food names to English.

PARSE MULTI-ITEM INPUTS:
Split on connectives: "再加"(and also), "and", "with", "plus", "還有"(also have)
Example: "牛扒再加蘑菇再加紅酒" → 3 items: steak, mushrooms, wine

DEFAULT PORTIONS:
Proteins: steak/beef 200g, chicken/fish 150g, eggs 50g each
Carbs: rice/pasta 150g, bread 30g/slice, potato 200g  
Vegetables: 100g, Fruits: 150g
Drinks: wine 150ml/glass, beer 330ml, spirits 30ml

MODIFIERS: 
"少少"/"a bit" = 50g/50ml
"三杯"/"three glasses" = 3x portion

Return JSON with items array and totalNutrition.`

const EXTRACTION_PROMPT_TEMPLATE = `Food: "{description}"

Split on: "再加", "and", "with"
Return JSON with items array only.`

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
      defaultHeaders: providerConfig.headers
      // Remove dangerouslyAllowBrowser as it's only needed for browser usage
    })
    
    this.provider = providerConfig.provider
    this.model = providerConfig.model
  }
  
  async extractFoodDataRaw(
    description: string,
    options?: ExtractFoodOptions
  ): Promise<any> {
    // Raw extraction without validation for debugging
    const prompt = this.buildPrompt(description, options)
    
    try {
      console.log('[LLM-RAW] Starting raw extraction')
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        response_format: this.supportsJsonMode() 
          ? { type: 'json_object' } 
          : undefined,
        temperature: 0.3,
        max_tokens: 4000
      })
      
      console.log('[LLM-RAW] Completion received:', {
        hasChoices: !!completion.choices,
        finishReason: completion.choices?.[0]?.finish_reason,
        hasContent: !!completion.choices?.[0]?.message?.content
      })
      
      const responseContent = completion.choices[0]?.message?.content
      if (!responseContent) {
        console.error('[LLM-RAW] Empty response, full completion:', JSON.stringify(completion))
        throw new Error('Empty response from LLM')
      }
      
      return this.parseJsonResponse(responseContent)
    } catch (error: any) {
      console.error('[LLM-RAW] Error:', error)
      throw error
    }
  }

  async extractFoodData(
    description: string, 
    options?: ExtractFoodOptions
  ): Promise<FoodExtractionResponse> {
    try {
      console.log('[LLM] Starting extraction for:', description)
      console.log('[LLM] Config:', {
        provider: this.provider,
        model: this.model,
        baseUrl: this.client.baseURL,
        hasApiKey: !!this.client.apiKey,
        apiKeyLength: this.client.apiKey?.length
      })
      
      // Always use native Gemini API when provider is gemini
      if (this.provider === 'gemini') {
        console.log('[LLM] Using native Gemini API for better multi-food extraction')
        const geminiService = getGeminiNativeService()
        return await geminiService.extractFoodData(description, options)
      }
      
      // For very long descriptions, try to split them intelligently
      if (description.length > 100) {
        // Split by common separators
        const separators = ['再加', '還有', 'and', 'with', 'plus', ',', '、', '，']
        let parts: string[] = []
        
        for (const sep of separators) {
          if (description.includes(sep)) {
            parts = description.split(sep).filter(p => p.trim())
            if (parts.length > 1) {
              console.log(`[LLM] Split input into ${parts.length} parts using separator: "${sep}"`)
              break
            }
          }
        }
        
        // If we successfully split into multiple parts, process in chunks
        if (parts.length > 3) {
          console.log('[LLM] Processing in chunks to avoid token limits')
          const allItems: any[] = []
          
          // Process in groups of 3 items
          for (let i = 0; i < parts.length; i += 3) {
            const chunk = parts.slice(i, i + 3).join(' and ')
            console.log(`[LLM] Processing chunk ${i/3 + 1}: ${chunk}`)
            
            const chunkResult = await this.extractFoodDataSimple(chunk, options)
            if (chunkResult.success && chunkResult.items) {
              allItems.push(...chunkResult.items)
            }
          }
          
          // Combine results
          if (allItems.length > 0) {
            return {
              success: true,
              confidence: 0.85,
              items: allItems,
              totalNutrition: this.calculateTotals(allItems),
              warnings: ['Processed in chunks due to length'],
              metadata: {
                provider: this.provider,
                model: this.model,
                processingTime: 0,
                tokensUsed: 0
              }
            }
          }
        }
      }
      
      // Regular processing for shorter inputs
      return await this.extractFoodDataSimple(description, options)
      
    } catch (error) {
      console.error('[LLM] Unexpected error in extractFoodData:', error)
      return this.handleError(error)
    }
  }
  
  private async extractFoodDataSimple(
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
          
          console.log(`[LLM] Attempt ${attempt + 1}/${this.maxRetries + 1} - Calling API`)
          
          const requestConfig = {
            model: this.model,
            messages: [
              { role: 'system', content: SYSTEM_PROMPT },
              { role: 'user', content: prompt }
            ],
            // Temporarily disable JSON mode to reduce token usage
            // response_format: this.supportsJsonMode() 
            //   ? { type: 'json_object' } 
            //   : undefined,
            temperature: 0.2,
            max_tokens: 1500  // Leave room for thinking tokens
            // Remove response_schema as it's not supported by OpenAI SDK
          } as any
          
          console.log('[LLM] Request config:', {
            model: requestConfig.model,
            hasMessages: !!requestConfig.messages,
            messageCount: requestConfig.messages?.length,
            temperature: requestConfig.temperature,
            maxTokens: requestConfig.max_tokens,
            hasResponseFormat: !!requestConfig.response_format
          })
          
          const completion = await this.client.chat.completions.create({
            ...requestConfig
          })
          
          console.log('[LLM] API Response:', {
            hasChoices: !!completion.choices,
            choiceCount: completion.choices?.length,
            finishReason: completion.choices?.[0]?.finish_reason,
            usage: completion.usage,
            hasContent: !!completion.choices?.[0]?.message?.content,
            contentLength: completion.choices?.[0]?.message?.content?.length,
            completionObject: JSON.stringify(completion).substring(0, 500)
          })
          
          const responseContent = completion.choices[0]?.message?.content
          if (!responseContent) {
            console.error('[LLM] Empty response from API')
            throw new Error('Empty response from LLM')
          }
          
          console.log('[LLM] Raw response (first 500 chars):', responseContent.substring(0, 500))
          
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
          
          console.error(`[LLM] Attempt ${attempt + 1} failed:`, {
            status: error?.status,
            code: error?.code,
            message: error?.message,
            type: error?.type,
            response: error?.response?.data,
            stack: error?.stack?.substring(0, 500),
            errorDetails: JSON.stringify(error).substring(0, 1000)
          })
          
          // Don't retry on certain errors
          if (error.status === 401 || error.status === 403) {
            console.error('[LLM] Authentication error, stopping retries')
            break
          }
          
          // Wait before retry
          if (attempt < this.maxRetries) {
            const delayMs = 1000 * (attempt + 1)
            console.log(`[LLM] Waiting ${delayMs}ms before retry...`)
            await this.delay(delayMs)
          }
        }
      }
      
      // All retries failed
      console.error('[LLM] All attempts failed, handling error')
      return this.handleError(lastError)
      
    } catch (error) {
      console.error('[LLM] Unexpected error in extractFoodData:', error)
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
      // If totalNutrition is missing or incomplete, calculate it
      if (!response.totalNutrition || typeof response.totalNutrition !== 'object') {
        response.totalNutrition = {}
      }
      
      // Calculate totals from items
      const calculatedTotals = this.calculateTotals(response.items || [])
      
      // Always use calculated totals for consistency
      response.totalNutrition = calculatedTotals
      
      // Validate with Zod schema
      const validated = FoodExtractionResponseSchema.parse(response)
      
      return validated
      
    } catch (error) {
      console.error('Response validation failed:', error)
      
      // Try to salvage what we can
      if (response?.items && Array.isArray(response.items) && response.items.length > 0) {
        const validItems = response.items.filter((item: any) => item?.name && item?.nutrition)
        if (validItems.length > 0) {
          return {
            success: true, // Mark as success if we have valid items
            confidence: response.confidence || 0.7,
            items: validItems,
            totalNutrition: this.calculateTotals(validItems),
            warnings: ['Some fields may have been adjusted for compatibility.']
          }
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
    console.error('[LLM] Final error handler:', {
      message: error?.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
      response: error?.response?.data,
      errorObject: error
    })
    
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
    
    console.log('LLM Provider Config:', {
      provider,
      hasApiKey: !!process.env.GEMINI_API_KEY,
      apiKeyLength: process.env.GEMINI_API_KEY?.length
    })
    
    if (provider === 'gemini') {
      // Use configured model or default to gemini-2.5-pro (advanced reasoning for better accuracy)
      // Set GEMINI_MODEL=gemini-2.5-flash for faster, lighter responses if needed
      // For production, use flash for faster responses to avoid timeouts
      const isProduction = process.env.NODE_ENV === 'production'
      // Balance between speed and accuracy - use flash with optimized prompts
      const defaultModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
      const geminiModel = customConfig?.model || defaultModel
      
      return {
        provider: 'gemini',
        apiKey: customConfig?.apiKey || process.env.GEMINI_API_KEY || '',
        baseUrl: customConfig?.baseUrl || 'https://generativelanguage.googleapis.com/v1beta/openai/',
        model: geminiModel,
        headers: customConfig?.headers || {},
        maxTokens: customConfig?.maxTokens || 2500,
        temperature: customConfig?.temperature || 0.3
      }
    }
    
    if (provider === 'openrouter') {
      return {
        provider: 'openrouter',
        apiKey: customConfig?.apiKey || process.env.OPENROUTER_API_KEY || '',
        baseUrl: customConfig?.baseUrl || 'https://openrouter.ai/api/v1/',
        model: customConfig?.model || process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash-latest',
        headers: customConfig?.headers || {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'Health Tracker'
        },
        maxTokens: customConfig?.maxTokens || 2500,
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