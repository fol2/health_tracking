import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const nutritionGoalsSchema = z.object({
  calories: z.number().min(0),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  fiber: z.number().min(0),
  water: z.number().min(0),
  enabled: z.boolean()
})

export async function GET() {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: session.user.id }
    })

    if (!profile) {
      return NextResponse.json({
        calories: 2000,
        protein: 50,
        carbs: 250,
        fat: 65,
        fiber: 25,
        water: 2000,
        enabled: true
      })
    }

    const nutritionGoals = (profile as any).nutritionGoals || {
      calories: 2000,
      protein: 50,
      carbs: 250,
      fat: 65,
      fiber: 25,
      water: 2000,
      enabled: true
    }

    return NextResponse.json(nutritionGoals)
  } catch (error) {
    console.error('Error fetching nutrition goals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch nutrition goals' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = nutritionGoalsSchema.parse(body)

    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: {
        nutritionGoals: validatedData as any
      },
      create: {
        userId: session.user.id,
        nutritionGoals: validatedData as any
      }
    })

    return NextResponse.json(validatedData)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating nutrition goals:', error)
    return NextResponse.json(
      { error: 'Failed to update nutrition goals' },
      { status: 500 }
    )
  }
}