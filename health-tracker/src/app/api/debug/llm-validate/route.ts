import { NextResponse } from 'next/server'
import { getLLMService } from '@/lib/services/llm.service'
import { FoodExtractionResponseSchema } from '@/types/llm.types'
import { z } from 'zod'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description = "apple" } = body
    
    console.log('[DEBUG-VALIDATE] Starting extraction for:', description)
    
    // Initialize the service
    const llmService = getLLMService()
    
    // Get raw extraction without validation
    const rawExtraction = await (llmService as any).extractFoodDataRaw(description)
    
    // Try to validate
    let validationError: any = null
    let validatedData: any = null
    
    try {
      validatedData = FoodExtractionResponseSchema.parse(rawExtraction)
    } catch (error) {
      if (error instanceof z.ZodError) {
        validationError = {
          message: 'Zod validation failed',
          issues: error.issues.map(issue => ({
            path: issue.path.join('.'),
            message: issue.message,
            code: issue.code,
            expected: (issue as any).expected,
            received: (issue as any).received
          }))
        }
      } else {
        validationError = {
          message: error instanceof Error ? error.message : 'Unknown validation error'
        }
      }
    }
    
    return NextResponse.json({
      rawData: rawExtraction,
      validationError,
      validatedData,
      debug: {
        provider: process.env.LLM_PROVIDER || 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('[DEBUG-VALIDATE] Error:', error)
    return NextResponse.json({
      error: error.message || 'Test failed',
      stack: error.stack?.substring(0, 500)
    }, { status: 500 })
  }
}