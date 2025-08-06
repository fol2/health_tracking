import { NextResponse } from 'next/server'

export async function GET() {
  // Debug endpoint to check LLM configuration
  // This is safe to expose as we're not revealing the actual values
  
  const config = {
    // Check if env vars exist (not the values themselves)
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    geminiKeyLength: process.env.GEMINI_API_KEY?.length || 0,
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    
    // Check other config
    provider: process.env.LLM_PROVIDER || 'not_set',
    model: process.env.GEMINI_MODEL || 'not_set',
    enabled: process.env.ENABLE_AI_FOOD_EXTRACTION === 'true',
    freeTierOnly: process.env.AI_EXTRACTION_FREE_TIER_ONLY === 'true',
    
    // Environment info
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    
    // Check if we can access any Vercel env vars
    hasVercelUrl: !!process.env.VERCEL_URL,
    hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
    
    // Raw env keys (just the keys, not values)
    envKeys: Object.keys(process.env).filter(key => 
      key.includes('GEMINI') || 
      key.includes('LLM') || 
      key.includes('AI_EXTRACTION')
    ).sort()
  }
  
  return NextResponse.json(config)
}