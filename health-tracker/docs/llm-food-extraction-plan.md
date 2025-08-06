# LLM-Powered Food Data Extraction Plan

## Overview
Integrate LLM API (Gemini/OpenRouter) to automatically extract nutritional information from user's natural language food descriptions, reducing manual input burden.

## 1. Prompt Design

### System Prompt
```
You are a nutrition data extraction assistant. Extract structured nutritional information from food descriptions.

Rules:
1. Parse the description to identify individual food items
2. Estimate portion sizes if not specified (use common serving sizes)
3. Provide nutritional data per item
4. If uncertain about exact values, provide reasonable estimates based on similar foods
5. Return ONLY valid JSON without any markdown formatting
```

### User Input Examples
- "I had a chicken sandwich with lettuce and mayo, and a medium coke"
- "2 eggs scrambled with butter, 2 slices of whole wheat toast with jam"
- "一碗白飯，蒸魚，炒菜心" (Bowl of rice, steamed fish, stir-fried choy sum)

## 2. JSON Response Schema

```typescript
interface FoodExtractionResponse {
  success: boolean;
  confidence: number; // 0-1 scale
  items: FoodItem[];
  totalNutrition: NutritionSummary;
  warnings?: string[]; // e.g., "Portion size estimated", "Nutritional values approximate"
}

interface FoodItem {
  name: string;
  quantity: number;
  unit: string; // g, oz, cup, piece, etc.
  category: 'protein' | 'carbs' | 'vegetables' | 'fruits' | 'dairy' | 'fats' | 'beverages' | 'other';
  nutrition: {
    calories: number;
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
    fiber?: number; // grams
    sugar?: number; // grams
    sodium?: number; // mg
  };
  confidence: number; // 0-1 scale for this specific item
}

interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber?: number;
  totalSugar?: number;
  totalSodium?: number;
}
```

## 3. Implementation Architecture

### API Service Layer
```typescript
// /src/lib/services/llm.service.ts
class LLMService {
  private provider: 'gemini' | 'openrouter';
  private apiKey: string;
  private model: string;
  
  async extractFoodData(description: string, options?: {
    language?: 'en' | 'zh' | 'auto';
    mealType?: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    estimatePortions?: boolean;
  }): Promise<FoodExtractionResponse>;
  
  private buildPrompt(description: string, options): string;
  private validateResponse(response: any): FoodExtractionResponse;
  private handleError(error: any): FoodExtractionResponse;
}
```

### Configuration
```typescript
// /src/lib/config/llm.config.ts
export const LLM_CONFIG = {
  providers: {
    gemini: {
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      models: ['gemini-2.5-flash', 'gemini-2.5-pro'],
      freeQuota: {
        'gemini-2.5-flash': { rpm: 15, rpd: 1500, tpm: 1000000 },
        'gemini-2.5-pro': { rpm: 2, rpd: 50, tpm: 32000 }
      }
    },
    openrouter: {
      baseUrl: 'https://openrouter.ai/api/v1/',
      models: ['google/gemini-2.5-flash', 'google/gemini-2.0-flash-exp:free'],
      headers: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
        'X-Title': 'Health Tracker'
      }
    }
  },
  defaultProvider: 'gemini',
  defaultModel: 'gemini-2.5-flash',
  maxRetries: 2,
  timeout: 30000
};
```

## 4. UI/UX Flow

### User Journey
1. **Manual Input with AI Assist**
   ```
   [Text Input] "Describe what you ate..."
   [Button] "✨ Extract with AI"
   ```

2. **Review & Edit**
   - Show extracted items in editable cards
   - Allow user to adjust quantities/values
   - Add missing items manually

3. **Confidence Indicators**
   - High confidence (>0.8): Green checkmark
   - Medium (0.5-0.8): Yellow warning
   - Low (<0.5): Red, suggest manual review

### Component Design
```tsx
// /src/components/meals/ai-food-input.tsx
interface AIFoodInputProps {
  onExtract: (items: FoodItem[]) => void;
  mealType?: MealType;
}

export function AIFoodInput({ onExtract, mealType }: AIFoodInputProps) {
  const [description, setDescription] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedItems, setExtractedItems] = useState<FoodItem[]>([]);
  const [showReview, setShowReview] = useState(false);
  
  // Implementation
}
```

## 5. API Endpoint

```typescript
// /src/app/api/meals/extract/route.ts
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { description, mealType, language } = await request.json();
  
  // Rate limiting check
  const rateLimitOk = await checkRateLimit(session.user.id);
  if (!rateLimitOk) {
    return NextResponse.json({ 
      error: 'Rate limit exceeded. Please try again later.' 
    }, { status: 429 });
  }
  
  try {
    const llmService = new LLMService();
    const result = await llmService.extractFoodData(description, {
      mealType,
      language: language || 'auto',
      estimatePortions: true
    });
    
    // Log usage for analytics
    await logLLMUsage(session.user.id, result);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Food extraction error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Failed to extract food data' 
    }, { status: 500 });
  }
}
```

## 6. Using OpenAI SDK for Flexibility

```typescript
// /src/lib/services/llm.service.ts
import OpenAI from 'openai';

class LLMService {
  private client: OpenAI;
  
  constructor() {
    const config = this.getProviderConfig();
    
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
      defaultHeaders: config.headers
    });
  }
  
  async extractFoodData(description: string, options?: ExtractOptions) {
    const prompt = this.buildPrompt(description, options);
    
    const completion = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3, // Lower for more consistent extraction
      max_tokens: 2000
    });
    
    const response = JSON.parse(completion.choices[0].message.content);
    return this.validateResponse(response);
  }
  
  private getProviderConfig() {
    const provider = process.env.LLM_PROVIDER || 'gemini';
    
    if (provider === 'gemini') {
      return {
        apiKey: process.env.GEMINI_API_KEY,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/',
        headers: {}
      };
    } else if (provider === 'openrouter') {
      return {
        apiKey: process.env.OPENROUTER_API_KEY,
        baseUrl: 'https://openrouter.ai/api/v1/',
        headers: {
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL,
          'X-Title': 'Health Tracker'
        }
      };
    }
  }
}
```

## 7. Database Schema Updates

```prisma
// Add to prisma/schema.prisma
model MealItem {
  id            String   @id @default(cuid())
  mealId        String
  name          String
  quantity      Float
  unit          String
  category      String
  calories      Float
  protein       Float
  carbs         Float
  fat           Float
  fiber         Float?
  sugar         Float?
  sodium        Float?
  confidence    Float?   // AI extraction confidence
  isAIExtracted Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  meal Meal @relation(fields: [mealId], references: [id], onDelete: Cascade)
  
  @@index([mealId])
}

model LLMUsageLog {
  id         String   @id @default(cuid())
  userId     String
  provider   String
  model      String
  tokens     Int
  cost       Float?
  success    Boolean
  createdAt  DateTime @default(now())
  
  user User @relation(fields: [userId], references: [id])
  
  @@index([userId])
  @@index([createdAt])
}
```

## 8. Error Handling & Fallbacks

```typescript
class LLMService {
  private async handleError(error: any): FoodExtractionResponse {
    console.error('LLM extraction error:', error);
    
    if (error.status === 429) {
      return {
        success: false,
        confidence: 0,
        items: [],
        totalNutrition: this.getEmptyNutrition(),
        warnings: ['Rate limit exceeded. Please try again later.']
      };
    }
    
    if (error.status === 401) {
      return {
        success: false,
        confidence: 0,
        items: [],
        totalNutrition: this.getEmptyNutrition(),
        warnings: ['API authentication failed. Please check configuration.']
      };
    }
    
    // Generic fallback
    return {
      success: false,
      confidence: 0,
      items: [],
      totalNutrition: this.getEmptyNutrition(),
      warnings: ['Failed to extract food data. Please input manually.']
    };
  }
}
```

## 9. Rate Limiting

```typescript
// /src/lib/services/rate-limit.service.ts
export async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `llm_rate_${userId}`;
  const now = Date.now();
  
  // Check daily limit
  const dailyCount = await redis.get(`${key}_daily`);
  if (dailyCount && parseInt(dailyCount) >= 50) { // Free tier daily limit
    return false;
  }
  
  // Check per-minute limit
  const minuteCount = await redis.get(`${key}_minute`);
  if (minuteCount && parseInt(minuteCount) >= 15) { // Free tier RPM
    return false;
  }
  
  // Increment counters
  await redis.incr(`${key}_daily`);
  await redis.expire(`${key}_daily`, 86400); // 24 hours
  
  await redis.incr(`${key}_minute`);
  await redis.expire(`${key}_minute`, 60); // 1 minute
  
  return true;
}
```

## 10. Testing Strategy

```typescript
// /tests/llm-extraction.test.ts
describe('LLM Food Extraction', () => {
  test('extracts simple meal correctly', async () => {
    const result = await llmService.extractFoodData('chicken breast 200g and broccoli');
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
    expect(result.items[0].name).toContain('chicken');
    expect(result.items[0].nutrition.protein).toBeGreaterThan(30);
  });
  
  test('handles multilingual input', async () => {
    const result = await llmService.extractFoodData('一碗白飯和炒雞肉');
    expect(result.success).toBe(true);
    expect(result.items).toHaveLength(2);
  });
  
  test('provides confidence scores', async () => {
    const result = await llmService.extractFoodData('something vague with stuff');
    expect(result.confidence).toBeLessThan(0.5);
    expect(result.warnings).toContain('Nutritional values approximate');
  });
});
```

## Environment Variables

```env
# LLM Configuration
LLM_PROVIDER=gemini                    # or 'openrouter'
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_key # Optional
LLM_MODEL=gemini-2.5-flash            # Default model

# Rate Limiting (optional Redis)
REDIS_URL=redis://localhost:6379       # For rate limiting

# Feature Flags
ENABLE_AI_FOOD_EXTRACTION=true
AI_EXTRACTION_FREE_TIER_ONLY=true
```

## Migration Path

### Phase 1: Beta Testing (Week 1-2)
- Deploy with feature flag
- Enable for 10% of users
- Collect accuracy metrics

### Phase 2: Improvement (Week 3-4)
- Refine prompts based on feedback
- Add common food database fallback
- Implement caching for common queries

### Phase 3: Full Rollout (Week 5)
- Enable for all users
- Add premium tier with higher limits
- Consider adding image-based extraction

## Cost Analysis

### Gemini Free Tier
- 1,500 requests/day (Flash)
- ~100 users × 5 meals/day = 500 requests
- Well within free limits

### Scaling Options
1. **Cache common foods**: Reduce API calls by 40%
2. **Batch processing**: Combine multiple items in one request
3. **Hybrid approach**: Use local database for common foods, AI for complex descriptions

## Success Metrics
- User input time reduced by 70%
- Nutritional data accuracy: >85%
- User satisfaction: >4.5/5
- API cost: <$10/month for 1000 users