export const LLM_CONFIG = {
  providers: {
    gemini: {
      name: 'Google Gemini',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      models: [
        {
          id: 'gemini-2.5-flash',
          name: 'Gemini 2.5 Flash',
          description: 'Fast, efficient model for quick responses',
          contextWindow: 1048576, // 1M tokens
          maxOutput: 8192,
          costPer1kTokens: 0, // Free tier
          freeQuota: {
            rpm: 15, // requests per minute
            rpd: 1500, // requests per day
            tpm: 1000000 // tokens per minute
          }
        },
        {
          id: 'gemini-2.5-pro',
          name: 'Gemini 2.5 Pro',
          description: 'Advanced model for complex tasks',
          contextWindow: 2097152, // 2M tokens
          maxOutput: 8192,
          costPer1kTokens: 0, // Free tier limited
          freeQuota: {
            rpm: 2,
            rpd: 50,
            tpm: 32000
          }
        },
        {
          id: 'gemini-1.5-flash',
          name: 'Gemini 1.5 Flash (Legacy)',
          description: 'Previous generation fast model',
          contextWindow: 1048576,
          maxOutput: 8192,
          costPer1kTokens: 0,
          freeQuota: {
            rpm: 15,
            rpd: 1500,
            tpm: 1000000
          }
        }
      ],
      features: {
        jsonMode: true,
        structuredOutput: true,
        functionCalling: true,
        vision: true,
        streaming: true
      },
      headers: {}
    },
    openrouter: {
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1/',
      models: [
        {
          id: 'google/gemini-2.5-flash',
          name: 'Gemini 2.5 Flash (via OpenRouter)',
          description: 'Google Gemini through OpenRouter',
          contextWindow: 1048576,
          maxOutput: 8192,
          costPer1kTokens: 0.00015 // $0.15 per million tokens
        },
        {
          id: 'google/gemini-2.0-flash-exp:free',
          name: 'Gemini 2.0 Flash Experimental (Free)',
          description: 'Free experimental model',
          contextWindow: 1048576,
          maxOutput: 8192,
          costPer1kTokens: 0,
          freeQuota: {
            rpm: 10,
            rpd: 100,
            tpm: 100000
          }
        },
        {
          id: 'anthropic/claude-3-haiku',
          name: 'Claude 3 Haiku',
          description: 'Fast, affordable Claude model',
          contextWindow: 200000,
          maxOutput: 4096,
          costPer1kTokens: 0.00025
        },
        {
          id: 'openai/gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Affordable GPT-4 variant',
          contextWindow: 128000,
          maxOutput: 16384,
          costPer1kTokens: 0.00015
        }
      ],
      features: {
        jsonMode: true,
        structuredOutput: false, // Varies by model
        functionCalling: true,
        vision: true, // Model dependent
        streaming: true
      },
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Health Tracker'
      }
    },
    openai: {
      name: 'OpenAI',
      baseUrl: 'https://api.openai.com/v1/',
      models: [
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Affordable, fast GPT-4 model',
          contextWindow: 128000,
          maxOutput: 16384,
          costPer1kTokens: 0.00015 // Input: $0.15, Output: $0.60 per million
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Most capable GPT-4 model',
          contextWindow: 128000,
          maxOutput: 4096,
          costPer1kTokens: 0.005 // Input: $5, Output: $15 per million
        },
        {
          id: 'gpt-3.5-turbo',
          name: 'GPT-3.5 Turbo',
          description: 'Fast, affordable model',
          contextWindow: 16385,
          maxOutput: 4096,
          costPer1kTokens: 0.0005 // Input: $0.50, Output: $1.50 per million
        }
      ],
      features: {
        jsonMode: true,
        structuredOutput: true,
        functionCalling: true,
        vision: true, // GPT-4o models only
        streaming: true
      },
      headers: {}
    }
  },
  
  // Default settings
  defaults: {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    temperature: 0.3, // Lower for more consistent extraction
    maxTokens: 2000,
    timeout: 30000, // 30 seconds
    maxRetries: 2
  },
  
  // Feature flags
  features: {
    enabled: process.env.ENABLE_AI_FOOD_EXTRACTION === 'true',
    freeTierOnly: process.env.AI_EXTRACTION_FREE_TIER_ONLY === 'true',
    cacheCommonFoods: true,
    batchProcessing: false, // Future feature
    imageExtraction: false // Future feature
  },
  
  // Rate limiting configuration
  rateLimits: {
    // Per user limits (aligned with free tier)
    perMinute: 10,
    perHour: 100,
    perDay: 500,
    
    // Global app limits (to stay within free tier)
    globalPerMinute: 50,
    globalPerHour: 1000,
    globalPerDay: 1500
  },
  
  // Common foods cache (reduces API calls)
  commonFoods: [
    {
      keywords: ['chicken breast', 'grilled chicken', '雞胸肉'],
      defaultPortion: { quantity: 100, unit: 'g' },
      nutrition: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6,
        fiber: 0,
        sugar: 0,
        sodium: 74
      }
    },
    {
      keywords: ['white rice', 'steamed rice', '白飯', '米飯'],
      defaultPortion: { quantity: 150, unit: 'g' }, // 1 bowl
      nutrition: {
        calories: 195,
        protein: 4.3,
        carbs: 42.5,
        fat: 0.6,
        fiber: 0.6,
        sugar: 0.1,
        sodium: 2
      }
    },
    {
      keywords: ['egg', 'boiled egg', '雞蛋', '水煮蛋'],
      defaultPortion: { quantity: 1, unit: 'piece' }, // ~50g
      nutrition: {
        calories: 78,
        protein: 6.3,
        carbs: 0.6,
        fat: 5.3,
        fiber: 0,
        sugar: 0.6,
        sodium: 62
      }
    },
    {
      keywords: ['banana', '香蕉'],
      defaultPortion: { quantity: 1, unit: 'medium' }, // ~118g
      nutrition: {
        calories: 105,
        protein: 1.3,
        carbs: 27,
        fat: 0.4,
        fiber: 3.1,
        sugar: 14.4,
        sodium: 1
      }
    },
    {
      keywords: ['apple', '蘋果'],
      defaultPortion: { quantity: 1, unit: 'medium' }, // ~182g
      nutrition: {
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4.4,
        sugar: 19,
        sodium: 2
      }
    },
    {
      keywords: ['milk', 'whole milk', '牛奶', '全脂牛奶'],
      defaultPortion: { quantity: 250, unit: 'ml' }, // 1 cup
      nutrition: {
        calories: 150,
        protein: 8,
        carbs: 12,
        fat: 8,
        fiber: 0,
        sugar: 12,
        sodium: 105
      }
    },
    {
      keywords: ['bread', 'whole wheat bread', '麵包', '全麥麵包'],
      defaultPortion: { quantity: 1, unit: 'slice' }, // ~28g
      nutrition: {
        calories: 69,
        protein: 3.6,
        carbs: 12,
        fat: 0.9,
        fiber: 1.9,
        sugar: 1.6,
        sodium: 132
      }
    }
  ]
}

// Helper function to get model configuration
export function getModelConfig(provider: string, modelId: string) {
  const providerConfig = LLM_CONFIG.providers[provider as keyof typeof LLM_CONFIG.providers]
  if (!providerConfig) return null
  
  return providerConfig.models.find(m => m.id === modelId)
}

// Helper function to check if a model is within free tier
export function isFreeTierModel(provider: string, modelId: string): boolean {
  const model = getModelConfig(provider, modelId)
  if (!model) return false
  
  return model.costPer1kTokens === 0 || !!model.freeQuota
}

// Helper function to get rate limits for a model
export function getModelRateLimits(provider: string, modelId: string) {
  const model = getModelConfig(provider, modelId)
  if (!model?.freeQuota) {
    return LLM_CONFIG.rateLimits
  }
  
  return {
    perMinute: Math.min(model.freeQuota.rpm, LLM_CONFIG.rateLimits.perMinute),
    perHour: Math.min(model.freeQuota.rpm * 60, LLM_CONFIG.rateLimits.perHour),
    perDay: Math.min(model.freeQuota.rpd, LLM_CONFIG.rateLimits.perDay),
    tokensPerMinute: model.freeQuota.tpm
  }
}

// Helper function to find cached food data
export function findCachedFood(description: string) {
  const descLower = description.toLowerCase()
  
  for (const food of LLM_CONFIG.commonFoods) {
    for (const keyword of food.keywords) {
      if (descLower.includes(keyword.toLowerCase())) {
        return {
          found: true,
          data: food
        }
      }
    }
  }
  
  return { found: false, data: null }
}

// Helper function to estimate if we should use cache
export function shouldUseCache(description: string): boolean {
  if (!LLM_CONFIG.features.cacheCommonFoods) return false
  
  // Simple heuristic: if description is short and matches common patterns
  const words = description.split(/\s+/)
  if (words.length <= 3) {
    return findCachedFood(description).found
  }
  
  return false
}

export default LLM_CONFIG