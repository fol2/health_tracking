import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schemas
const createWeightSchema = z.object({
  weight: z.number().positive().max(635), // Max recorded human weight
  notes: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
})

const updateWeightSchema = z.object({
  weight: z.number().positive().max(635).optional(),
  notes: z.string().optional(),
})

// GET /api/health/weight - Get weight history
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '30')

    const records = await prisma.weightRecord.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({ records })
  } catch (error) {
    console.error('Failed to fetch weight records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weight records' },
      { status: 500 }
    )
  }
}

// POST /api/health/weight - Create weight record
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createWeightSchema.parse(body)

    const record = await prisma.weightRecord.create({
      data: {
        userId: session.user.id,
        weight: validated.weight,
        notes: validated.notes,
        recordedAt: validated.recordedAt ? new Date(validated.recordedAt) : new Date(),
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to create weight record:', error)
    return NextResponse.json(
      { error: 'Failed to create weight record' },
      { status: 500 }
    )
  }
}