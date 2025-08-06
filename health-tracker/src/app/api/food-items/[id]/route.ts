import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'
import { z } from 'zod'

const updateFoodItemSchema = z.object({
  name: z.string().min(1).optional(),
  brand: z.string().optional(),
  barcode: z.string().optional(),
  servingSize: z.number().positive().optional(),
  servingUnit: z.string().optional(),
  calories: z.number().min(0).optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  fiber: z.number().min(0).optional(),
  sugar: z.number().min(0).optional(),
  sodium: z.number().min(0).optional(),
  isPublic: z.boolean().optional()
})

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const foodItem = await mealService.getFoodItemById(id)
    
    if (!foodItem) {
      return NextResponse.json({ error: 'Food item not found' }, { status: 404 })
    }

    return NextResponse.json(foodItem)
  } catch (error) {
    console.error('Error fetching food item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch food item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    const body = await request.json()
    const validatedData = updateFoodItemSchema.parse(body)

    const foodItem = await mealService.updateFoodItem(id, session.user.id, validatedData)
    return NextResponse.json(foodItem)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating food item:', error)
    return NextResponse.json(
      { error: 'Failed to update food item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await context.params
    await mealService.deleteFoodItem(id, session.user.id)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting food item:', error)
    return NextResponse.json(
      { error: 'Failed to delete food item' },
      { status: 500 }
    )
  }
}