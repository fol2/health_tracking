import { NextRequest, NextResponse } from 'next/server'
import { getGeminiNativeService } from '@/lib/services/gemini-native.service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { description, mealType } = body
    
    console.log('[DEBUG] Native Gemini test request:', { description, mealType })
    
    const geminiService = getGeminiNativeService()
    const result = await geminiService.extractFoodData(description, { mealType })
    
    return NextResponse.json({
      success: true,
      result,
      debug: {
        provider: 'gemini-native',
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('[DEBUG] Native Gemini test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to extract food data',
      debug: {
        provider: 'gemini-native',
        model: 'gemini-2.5-flash',
        timestamp: new Date().toISOString(),
        errorDetails: error.stack
      }
    })
  }
}