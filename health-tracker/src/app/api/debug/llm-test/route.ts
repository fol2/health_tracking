import { NextResponse } from 'next/server'
import { getLLMService } from '@/lib/services/llm.service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { description = "grilled chicken breast 200g with brown rice 150g and steamed broccoli", mealType = "lunch" } = body
    
    console.log('[DEBUG] Test extraction request:', { description, mealType })
    
    // Initialize the service
    const llmService = getLLMService()
    
    // Test extraction
    const startTime = Date.now()
    const result = await llmService.extractFoodData(description, {
      mealType,
      language: 'auto'
    })
    const endTime = Date.now()
    
    // Return comprehensive debug info
    return NextResponse.json({
      success: result.success,
      processingTime: endTime - startTime,
      result,
      debug: {
        provider: process.env.LLM_PROVIDER || 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('[DEBUG] Test extraction error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Test extraction failed',
      errorDetails: {
        status: error?.status,
        code: error?.code,
        type: error?.type,
        stack: error?.stack?.substring(0, 500)
      },
      debug: {
        provider: process.env.LLM_PROVIDER || 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 })
  }
}

export async function GET() {
  // Simple test endpoint to verify service can be initialized
  try {
    const llmService = getLLMService()
    
    return NextResponse.json({
      status: 'ready',
      config: {
        provider: process.env.LLM_PROVIDER || 'gemini',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-pro',
        hasApiKey: !!process.env.GEMINI_API_KEY,
        apiKeyLength: process.env.GEMINI_API_KEY?.length,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/'
      },
      testDescription: 'POST to this endpoint with {"description": "your food"} to test extraction',
      timestamp: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      error: error.message || 'Service initialization failed',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}