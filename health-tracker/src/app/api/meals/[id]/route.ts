import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'
import { z } from 'zod'

const updateMealLogSchema = z.object({
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']).optional(),
  loggedAt: z.string().datetime().optional(),
  notes: z.string().optional(),
  foodItems: z.array(z.object({
    foodItemId: z.string(),
    quantity: z.number().positive()
  })).optional()
})

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const mealLog = await mealService.getMealLogById(id, session.user.id)

    if (!mealLog) {
      return NextResponse.json({ error: 'Meal log not found' }, { status: 404 })
    }

    return NextResponse.json(mealLog)
  } catch (error) {
    console.error('Error fetching meal log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal log' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const validatedData = updateMealLogSchema.parse(body)

    const mealLog = await mealService.updateMealLog(
      id,
      session.user.id,
      {
        ...validatedData,
        loggedAt: validatedData.loggedAt ? new Date(validatedData.loggedAt) : undefined
      }
    )

    return NextResponse.json(mealLog)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating meal log:', error)
    return NextResponse.json(
      { error: 'Failed to update meal log' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await mealService.deleteMealLog(id, session.user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting meal log:', error)
    return NextResponse.json(
      { error: 'Failed to delete meal log' },
      { status: 500 }
    )
  }
}