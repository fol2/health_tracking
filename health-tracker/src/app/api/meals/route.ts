import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'
import { z } from 'zod'

// Validation schemas
const createMealLogSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  loggedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  foodItems: z.array(z.object({
    foodItemId: z.string(),
    quantity: z.number().positive()
  })).optional()
})

// Helper function for authentication
async function requireAuth() {
  const session = await getServerSession()
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  return { userId: session.user.id }
}

// Helper function for error responses
function handleError(error: unknown, message: string) {
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: 'Validation error', details: error.issues },
      { status: 400 }
    )
  }
  console.error(message, error)
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const { searchParams } = request.nextUrl
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const meals = await mealService.getMealLogs(
      auth.userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    )

    return NextResponse.json(meals)
  } catch (error) {
    return handleError(error, 'Failed to fetch meal logs')
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuth()
    if ('error' in auth) return auth.error

    const body = await request.json()
    const validatedData = createMealLogSchema.parse(body)

    const mealLog = await mealService.createMealLog({
      userId: auth.userId,
      mealType: validatedData.mealType,
      loggedAt: validatedData.loggedAt ? new Date(validatedData.loggedAt) : undefined,
      notes: validatedData.notes,
      foodItems: validatedData.foodItems
    })

    return NextResponse.json(mealLog)
  } catch (error) {
    return handleError(error, 'Failed to create meal log')
  }
}