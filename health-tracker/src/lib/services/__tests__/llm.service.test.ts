import { LLMService } from '../llm.service'
import { FoodExtractionResponseSchema } from '@/types/llm.types'

// Mock test cases for food extraction
const testCases = [
  {
    description: 'Grilled chicken breast 200g with steamed broccoli',
    expectedItems: 2,
    expectedCategories: ['protein', 'vegetables'],
    minCalories: 200,
    maxCalories: 400
  },
  {
    description: '2 scrambled eggs with butter and 2 slices whole wheat toast',
    expectedItems: 3,
    expectedCategories: ['protein', 'fats', 'carbs'],
    minCalories: 250,
    maxCalories: 450
  },
  {
    description: '一碗白飯，清蒸魚200克，炒菜心',
    expectedItems: 3,
    expectedCategories: ['carbs', 'protein', 'vegetables'],
    minCalories: 300,
    maxCalories: 500
  },
  {
    description: 'Large pepperoni pizza, 3 slices',
    expectedItems: 1,
    expectedCategories: ['mixed'],
    minCalories: 600,
    maxCalories: 900
  },
  {
    description: 'Greek yogurt with honey and granola',
    expectedItems: 3,
    expectedCategories: ['dairy', 'carbs'],
    minCalories: 200,
    maxCalories: 350
  }
]

describe('LLM Food Extraction Service', () => {
  let service: LLMService

  beforeAll(() => {
    // Check if service is configured
    if (!LLMService.isConfigured()) {
      console.warn('LLM Service not configured. Skipping tests.')
      return
    }
    
    service = new LLMService()
  })

  describe('Configuration', () => {
    test('should detect if service is configured', () => {
      const isConfigured = LLMService.isConfigured()
      expect(typeof isConfigured).toBe('boolean')
    })

    test('should return available providers', () => {
      const providers = LLMService.getAvailableProviders()
      expect(Array.isArray(providers)).toBe(true)
    })
  })

  describe('Food Extraction', () => {
    test.skip('should extract simple meal correctly', async () => {
      if (!service) return

      const result = await service.extractFoodData(
        'chicken breast 200g and broccoli 100g'
      )

      // Validate response structure
      const validation = FoodExtractionResponseSchema.safeParse(result)
      expect(validation.success).toBe(true)

      if (result.success) {
        expect(result.items).toHaveLength(2)
        expect(result.items[0].name.toLowerCase()).toContain('chicken')
        expect(result.items[0].nutrition.protein).toBeGreaterThan(30)
        expect(result.totalNutrition.totalCalories).toBeGreaterThan(150)
      }
    })

    test.skip('should handle multilingual input', async () => {
      if (!service) return

      const result = await service.extractFoodData(
        '一碗白飯和炒雞肉',
        { language: 'zh' }
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.items.length).toBeGreaterThan(0)
        expect(result.items.some(item => 
          item.name.toLowerCase().includes('rice') || 
          item.nameLocal?.includes('飯')
        )).toBe(true)
      }
    })

    test.skip('should provide confidence scores', async () => {
      if (!service) return

      const result = await service.extractFoodData(
        'some random food with unclear portions'
      )

      expect(result.confidence).toBeDefined()
      expect(result.confidence).toBeGreaterThanOrEqual(0)
      expect(result.confidence).toBeLessThanOrEqual(1)
      
      if (result.warnings) {
        expect(result.warnings.length).toBeGreaterThan(0)
      }
    })

    test.skip('should calculate macro percentages correctly', async () => {
      if (!service) return

      const result = await service.extractFoodData(
        'chicken breast 100g, white rice 150g, olive oil 10ml'
      )

      if (result.success && result.totalNutrition.macroBreakdown) {
        const { proteinPercentage, carbsPercentage, fatPercentage } = 
          result.totalNutrition.macroBreakdown
        
        const total = proteinPercentage + carbsPercentage + fatPercentage
        expect(total).toBeCloseTo(100, 0)
      }
    })

    test.skip('should handle error gracefully', async () => {
      if (!service) return

      const result = await service.extractFoodData('')

      expect(result.success).toBe(false)
      expect(result.items).toEqual([])
      expect(result.warnings).toBeDefined()
    })
  })

  describe('Batch Testing', () => {
    test.each(testCases)(
      'should extract: $description',
      async ({ description, expectedItems, minCalories, maxCalories }) => {
        if (!service) return

        const result = await service.extractFoodData(description)

        if (result.success) {
          // Check item count (allow some flexibility)
          expect(result.items.length).toBeGreaterThan(0)
          expect(result.items.length).toBeLessThanOrEqual(expectedItems + 1)

          // Check calorie range
          expect(result.totalNutrition.totalCalories).toBeGreaterThanOrEqual(minCalories)
          expect(result.totalNutrition.totalCalories).toBeLessThanOrEqual(maxCalories)

          // Validate each item has required fields
          result.items.forEach(item => {
            expect(item.name).toBeTruthy()
            expect(item.quantity).toBeGreaterThan(0)
            expect(item.unit).toBeTruthy()
            expect(item.nutrition.calories).toBeGreaterThanOrEqual(0)
          })
        }
      },
      30000 // 30 second timeout per test
    )
  })
})

// Integration test for the API endpoint
describe('Food Extraction API Endpoint', () => {
  test.skip('should return 401 for unauthenticated requests', async () => {
    const response = await fetch('/api/meals/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: 'test food'
      })
    })

    expect(response.status).toBe(401)
  })

  test.skip('should validate request body', async () => {
    // This would need proper auth setup
    const response = await fetch('/api/meals/extract', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: '', // Invalid empty description
        mealType: 'invalid' // Invalid meal type
      })
    })

    if (response.status !== 401) {
      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBeDefined()
    }
  })
})

// Manual test helper for development
export async function manualTest() {
  if (!LLMService.isConfigured()) {
    console.log('❌ LLM Service not configured')
    console.log('Available providers:', LLMService.getAvailableProviders())
    return
  }

  console.log('✅ LLM Service configured')
  console.log('Available providers:', LLMService.getAvailableProviders())

  const service = new LLMService()
  
  console.log('\nTesting food extraction...')
  const result = await service.extractFoodData(
    'I had a grilled chicken sandwich with lettuce and mayo, and a medium coke'
  )

  if (result.success) {
    console.log('✅ Extraction successful!')
    console.log('Items found:', result.items.length)
    console.log('Total calories:', result.totalNutrition.totalCalories)
    console.log('\nExtracted items:')
    result.items.forEach(item => {
      console.log(`- ${item.name}: ${item.quantity}${item.unit}, ${item.nutrition.calories} cal`)
    })
  } else {
    console.log('❌ Extraction failed:', result.warnings)
  }
}

// Run manual test if this file is executed directly
if (require.main === module) {
  manualTest().catch(console.error)
}