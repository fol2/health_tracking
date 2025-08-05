import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'
import { z } from 'zod'

const createFoodItemSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  servingSize: z.number().positive().optional(),
  servingUnit: z.string().optional(),
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  isPublic: z.boolean().optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (query) {
      const foodItems = await mealService.searchFoodItems(query, session.user.id)
      return NextResponse.json(foodItems)
    } else {
      const foodItems = await mealService.getUserFoodItems(session.user.id)
      return NextResponse.json(foodItems)
    }
  } catch (error) {
    console.error('Error fetching food items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch food items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createFoodItemSchema.parse(body)

    const foodItem = await mealService.createFoodItem({
      ...validatedData,
      userId: session.user.id
    })

    return NextResponse.json(foodItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating food item:', error)
    return NextResponse.json(
      { error: 'Failed to create food item' },
      { status: 500 }
    )
  }
}