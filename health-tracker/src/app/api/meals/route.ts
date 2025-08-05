import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'
import { z } from 'zod'

const createMealLogSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  loggedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  foodItems: z.array(z.object({
    foodItemId: z.string(),
    quantity: z.number().positive()
  })).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const meals = await mealService.getMealLogs(
      session.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    return NextResponse.json(meals)
  } catch (error) {
    console.error('Error fetching meal logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal logs' },
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
    const validatedData = createMealLogSchema.parse(body)

    const mealLog = await mealService.createMealLog({
      userId: session.user.id,
      mealType: validatedData.mealType,
      loggedAt: validatedData.loggedAt ? new Date(validatedData.loggedAt) : undefined,
      notes: validatedData.notes,
      foodItems: validatedData.foodItems
    })

    return NextResponse.json(mealLog)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating meal log:', error)
    return NextResponse.json(
      { error: 'Failed to create meal log' },
      { status: 500 }
    )
  }
}