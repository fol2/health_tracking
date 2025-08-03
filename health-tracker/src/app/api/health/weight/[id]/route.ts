import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema for updates
const updateWeightSchema = z.object({
  weight: z.number().positive().max(635).optional(),
  notes: z.string().optional(),
})

interface RouteParams {
  params: Promise<{
    id: string
  }>
}

// PATCH /api/health/weight/[id] - Update weight record
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = updateWeightSchema.parse(body)

    // Verify ownership
    const existing = await prisma.weightRecord.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const updated = await prisma.weightRecord.update({
      where: {
        id: id,
      },
      data: {
        weight: validated.weight ?? existing.weight,
        notes: validated.notes ?? existing.notes,
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to update weight record:', error)
    return NextResponse.json(
      { error: 'Failed to update weight record' },
      { status: 500 }
    )
  }
}

// DELETE /api/health/weight/[id] - Delete weight record
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existing = await prisma.weightRecord.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    await prisma.weightRecord.delete({
      where: {
        id: id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete weight record:', error)
    return NextResponse.json(
      { error: 'Failed to delete weight record' },
      { status: 500 }
    )
  }
}