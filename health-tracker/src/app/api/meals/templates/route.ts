import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTemplateSchema = z.object({
  name: z.string().min(1),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  foodItems: z.array(z.object({
    foodItemId: z.string(),
    quantity: z.number().positive()
  })).min(1)
})

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.mealTemplate.findMany({
      where: { userId: session.user.id },
      include: {
        foodItems: {
          include: {
            foodItem: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching meal templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal templates' },
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
    const validatedData = createTemplateSchema.parse(body)

    const template = await prisma.mealTemplate.create({
      data: {
        userId: session.user.id,
        name: validatedData.name,
        mealType: validatedData.mealType,
        foodItems: {
          create: validatedData.foodItems.map(item => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity
          }))
        }
      },
      include: {
        foodItems: {
          include: {
            foodItem: true
          }
        }
      }
    })

    return NextResponse.json(template)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating meal template:', error)
    return NextResponse.json(
      { error: 'Failed to create meal template' },
      { status: 500 }
    )
  }
}