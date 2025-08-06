import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getLLMService, LLMService } from '@/lib/services/llm.service'
import { ExtractFoodOptions } from '@/types/llm.types'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { LLM_CONFIG, shouldUseCache, findCachedFood, getModelRateLimits } from '@/lib/config/llm.config'

// Request validation schema
const ExtractRequestSchema = z.object({
  description: z.string().min(1).max(1000),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  language: z.enum(['en', 'zh', 'auto']).optional(),
  useCache: z.boolean().optional().default(true),
  provider: z.enum(['gemini', 'openrouter', 'openai']).optional(),
  model: z.string().optional()
})

// Simple in-memory rate limiting (consider using Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

async function checkRateLimit(userId: string): Promise<boolean> {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)
  
  // Get configured rate limits
  const provider = process.env.LLM_PROVIDER || 'gemini'
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const limits = getModelRateLimits(provider, model)
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + 60000 // 1 minute window
    })
    return true
  }
  
  if (userLimit.count >= limits.perMinute) {
    return false
  }
  
  userLimit.count++
  return true
}

async function logLLMUsage(
  userId: string, 
  result: any,
  provider: string,
  model: string,
  processingTime: number
) {
  try {
    // Log to database for analytics
    await prisma.$executeRaw`
      INSERT INTO "LLMUsageLog" (id, "userId", provider, model, tokens, cost, success, "createdAt")
      VALUES (
        gen_random_uuid(),
        ${userId},
        ${provider},
        ${model},
        ${result.metadata?.tokensUsed || 0},
        0,
        ${result.success},
        NOW()
      )
    `
  } catch (error) {
    console.error('Failed to log LLM usage:', error)
    // Don't fail the request if logging fails
  }
}

export async function POST(request: Request) {
  try {
    // Check if feature is enabled
    if (!LLM_CONFIG.features.enabled) {
      return NextResponse.json(
        { error: 'AI food extraction is not enabled' },
        { status: 503 }
      )
    }
    
    // Authenticate user
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse and validate request
    const body = await request.json()
    const validatedData = ExtractRequestSchema.parse(body)
    
    // Check rate limit
    const rateLimitOk = await checkRateLimit(session.user.id)
    if (!rateLimitOk) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please try again in a minute.',
          retryAfter: 60
        },
        { status: 429 }
      )
    }
    
    // Check if we should use cached data
    if (validatedData.useCache && shouldUseCache(validatedData.description)) {
      const cached = findCachedFood(validatedData.description)
      if (cached.found && cached.data) {
        // Return cached response formatted as extraction response
        return NextResponse.json({
          success: true,
          confidence: 1.0,
          items: [{
            name: cached.data.keywords[0],
            quantity: cached.data.defaultPortion.quantity,
            unit: cached.data.defaultPortion.unit,
            category: 'mixed', // Default category
            nutrition: cached.data.nutrition,
            confidence: 1.0,
            source: 'database'
          }],
          totalNutrition: {
            ...cached.data.nutrition,
            totalCalories: cached.data.nutrition.calories,
            totalProtein: cached.data.nutrition.protein,
            totalCarbs: cached.data.nutrition.carbs,
            totalFat: cached.data.nutrition.fat,
            totalFiber: cached.data.nutrition.fiber || 0,
            totalSugar: cached.data.nutrition.sugar || 0,
            totalSodium: cached.data.nutrition.sodium || 0,
            macroBreakdown: {
              proteinPercentage: Math.round((cached.data.nutrition.protein * 4 / cached.data.nutrition.calories) * 100),
              carbsPercentage: Math.round((cached.data.nutrition.carbs * 4 / cached.data.nutrition.calories) * 100),
              fatPercentage: Math.round((cached.data.nutrition.fat * 9 / cached.data.nutrition.calories) * 100)
            }
          },
          metadata: {
            provider: 'cache',
            model: 'local',
            processingTime: 0,
            cached: true
          }
        })
      }
    }
    
    // Check if LLM service is configured
    if (!LLMService.isConfigured()) {
      return NextResponse.json(
        { 
          error: 'LLM service is not configured. Please add API keys to environment variables.',
          availableProviders: LLMService.getAvailableProviders()
        },
        { status: 503 }
      )
    }
    
    // Initialize LLM service with custom config if provided
    const llmConfig = validatedData.provider ? {
      provider: validatedData.provider,
      model: validatedData.model
    } : undefined
    
    const startTime = Date.now()
    const llmService = getLLMService(llmConfig)
    
    // Extract food data
    const extractOptions: ExtractFoodOptions = {
      mealType: validatedData.mealType,
      language: validatedData.language || 'auto',
      estimatePortions: true,
      useCommonDatabase: true
    }
    
    const result = await llmService.extractFoodData(
      validatedData.description,
      extractOptions
    )
    
    const processingTime = Date.now() - startTime
    
    // Log usage for analytics
    await logLLMUsage(
      session.user.id,
      result,
      llmConfig?.provider || process.env.LLM_PROVIDER || 'gemini',
      llmConfig?.model || process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      processingTime
    )
    
    // Add processing time to metadata
    if (result.metadata) {
      result.metadata.processingTime = processingTime
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Food extraction error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      )
    }
    
    if (error instanceof Error) {
      // Check for specific error types
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'API configuration error. Please check your API keys.' },
          { status: 503 }
        )
      }
      
      if (error.message.includes('timeout')) {
        return NextResponse.json(
          { error: 'Request timed out. Please try again with a simpler description.' },
          { status: 504 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to extract food data. Please try again or input manually.',
        success: false
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check service status
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const isConfigured = LLMService.isConfigured()
  const availableProviders = LLMService.getAvailableProviders()
  const isEnabled = LLM_CONFIG.features.enabled
  
  // Get user's usage stats for today
  let usageToday = 0
  try {
    const result = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM "LLMUsageLog"
      WHERE "userId" = ${session.user.id}
      AND DATE("createdAt") = CURRENT_DATE
    `
    usageToday = parseInt(result[0]?.count || '0')
  } catch (error) {
    console.error('Failed to get usage stats:', error)
  }
  
  // Get rate limits
  const provider = process.env.LLM_PROVIDER || 'gemini'
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash'
  const limits = getModelRateLimits(provider, model)
  
  return NextResponse.json({
    status: isConfigured && isEnabled ? 'ready' : 'not_configured',
    enabled: isEnabled,
    configured: isConfigured,
    availableProviders,
    currentProvider: process.env.LLM_PROVIDER || 'gemini',
    currentModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    features: {
      cacheEnabled: LLM_CONFIG.features.cacheCommonFoods,
      freeTierOnly: LLM_CONFIG.features.freeTierOnly
    },
    usage: {
      today: usageToday,
      dailyLimit: limits.perDay,
      remaining: Math.max(0, limits.perDay - usageToday)
    },
    rateLimits: limits
  })
}