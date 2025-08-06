export interface FoodExtractionResponse {
  success: boolean
  confidence: number // 0-1 scale for overall extraction confidence
  items: FoodItem[]
  totalNutrition: NutritionSummary
  warnings?: string[] // e.g., "Portion size estimated", "Nutritional values approximate"
  metadata?: {
    provider: string
    model: string
    processingTime: number // milliseconds
    tokensUsed?: number
    cached?: boolean
  }
}

export interface FoodItem {
  name: string
  nameLocal?: string // For multilingual support (e.g., Chinese name)
  quantity: number
  unit: FoodUnit
  category: FoodCategory
  nutrition: NutritionData
  confidence: number // 0-1 scale for this specific item
  source?: 'ai' | 'database' | 'manual'
  brandName?: string // If applicable
  barcode?: string // For future barcode scanning
}

export interface NutritionData {
  calories: number
  protein: number // grams
  carbs: number // grams
  fat: number // grams
  fiber?: number // grams
  sugar?: number // grams
  sodium?: number // mg
  saturatedFat?: number // grams
  transFat?: number // grams
  cholesterol?: number // mg
  vitaminA?: number // IU
  vitaminC?: number // mg
  calcium?: number // mg
  iron?: number // mg
}

export interface NutritionSummary extends NutritionData {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  macroBreakdown: {
    proteinPercentage: number
    carbsPercentage: number
    fatPercentage: number
  }
}

export type FoodUnit = 
  | 'g' 
  | 'kg' 
  | 'oz' 
  | 'lb' 
  | 'ml' 
  | 'l' 
  | 'cup' 
  | 'tbsp' 
  | 'tsp' 
  | 'piece' 
  | 'slice' 
  | 'bowl' 
  | 'plate' 
  | 'serving'
  | 'small'
  | 'medium'
  | 'large'

export type FoodCategory = 
  | 'protein' 
  | 'carbs' 
  | 'vegetables' 
  | 'fruits' 
  | 'dairy' 
  | 'fats' 
  | 'beverages' 
  | 'snacks'
  | 'desserts'
  | 'condiments'
  | 'mixed' // For complex dishes
  | 'other'

export interface ExtractFoodOptions {
  language?: 'en' | 'zh' | 'auto'
  mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  estimatePortions?: boolean
  useCommonDatabase?: boolean // Fallback to common food database
  includeAlternatives?: boolean // Suggest similar foods if uncertain
  maxItems?: number // Limit number of items to extract
}

export interface LLMProviderConfig {
  provider: 'gemini' | 'openrouter' | 'openai'
  apiKey: string
  baseUrl: string
  model: string
  headers?: Record<string, string>
  maxTokens?: number
  temperature?: number
  timeout?: number
}

export interface LLMUsageLog {
  userId: string
  provider: string
  model: string
  inputTokens?: number
  outputTokens?: number
  totalTokens: number
  cost?: number
  success: boolean
  responseTime: number
  endpoint: string
  timestamp: Date
}

// JSON Schema for Gemini/OpenAI structured output
export const foodExtractionSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          nameLocal: { type: 'string' },
          quantity: { type: 'number' },
          unit: { 
            type: 'string',
            enum: ['g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 'piece', 'slice', 'bowl', 'plate', 'serving', 'small', 'medium', 'large']
          },
          category: {
            type: 'string',
            enum: ['protein', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 'beverages', 'snacks', 'desserts', 'condiments', 'mixed', 'other']
          },
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
            required: ['calories', 'protein', 'carbs', 'fat']
          },
          confidence: { type: 'number', minimum: 0, maximum: 1 }
        },
        required: ['name', 'quantity', 'unit', 'category', 'nutrition', 'confidence']
      }
    },
    totalNutrition: {
      type: 'object',
      properties: {
        totalCalories: { type: 'number' },
        totalProtein: { type: 'number' },
        totalCarbs: { type: 'number' },
        totalFat: { type: 'number' },
        totalFiber: { type: 'number' },
        totalSugar: { type: 'number' },
        totalSodium: { type: 'number' },
        macroBreakdown: {
          type: 'object',
          properties: {
            proteinPercentage: { type: 'number' },
            carbsPercentage: { type: 'number' },
            fatPercentage: { type: 'number' }
          },
          required: ['proteinPercentage', 'carbsPercentage', 'fatPercentage']
        }
      },
      required: ['totalCalories', 'totalProtein', 'totalCarbs', 'totalFat', 'macroBreakdown']
    },
    warnings: {
      type: 'array',
      items: { type: 'string' }
    }
  },
  required: ['success', 'confidence', 'items', 'totalNutrition']
}

// Validation schemas using Zod (for runtime validation)
import { z } from 'zod'

export const FoodUnitSchema = z.enum([
  'g', 'kg', 'oz', 'lb', 'ml', 'l', 'cup', 'tbsp', 'tsp', 
  'piece', 'slice', 'bowl', 'plate', 'serving', 'small', 'medium', 'large'
])

export const FoodCategorySchema = z.enum([
  'protein', 'carbs', 'vegetables', 'fruits', 'dairy', 'fats', 
  'beverages', 'snacks', 'desserts', 'condiments', 'mixed', 'other'
])

export const NutritionDataSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  saturatedFat: z.number().min(0).optional(),
  transFat: z.number().min(0).optional(),
  cholesterol: z.number().min(0).optional(),
  vitaminA: z.number().min(0).optional(),
  vitaminC: z.number().min(0).optional(),
  calcium: z.number().min(0).optional(),
  iron: z.number().min(0).optional()
})

export const FoodItemSchema = z.object({
  name: z.string().min(1),
  nameLocal: z.string().optional(),
  quantity: z.number().positive(),
  unit: FoodUnitSchema,
  category: FoodCategorySchema,
  nutrition: NutritionDataSchema,
  confidence: z.number().min(0).max(1),
  source: z.enum(['ai', 'database', 'manual']).optional(),
  brandName: z.string().optional(),
  barcode: z.string().optional()
})

export const MacroBreakdownSchema = z.object({
  proteinPercentage: z.number().min(0).max(100),
  carbsPercentage: z.number().min(0).max(100),
  fatPercentage: z.number().min(0).max(100)
})

export const NutritionSummarySchema = NutritionDataSchema.extend({
  totalCalories: z.number().min(0),
  totalProtein: z.number().min(0),
  totalCarbs: z.number().min(0),
  totalFat: z.number().min(0),
  macroBreakdown: MacroBreakdownSchema
})

export const FoodExtractionResponseSchema = z.object({
  success: z.boolean(),
  confidence: z.number().min(0).max(1),
  items: z.array(FoodItemSchema),
  totalNutrition: NutritionSummarySchema,
  warnings: z.array(z.string()).optional(),
  metadata: z.object({
    provider: z.string(),
    model: z.string(),
    processingTime: z.number(),
    tokensUsed: z.number().optional()
  }).optional()
})

export type ValidatedFoodExtractionResponse = z.infer<typeof FoodExtractionResponseSchema>