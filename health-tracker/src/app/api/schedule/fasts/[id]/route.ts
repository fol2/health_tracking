import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// Validation schema for updates
const updateScheduledFastSchema = z.object({
  type: z.string().optional(),
  scheduledStart: z.string().datetime().optional(),
  scheduledEnd: z.string().datetime().optional(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().min(1).max(30),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
  notes: z.string().optional(),
})

// GET /api/schedule/fasts/[id] - Get a specific scheduled fast
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fast = await prisma.scheduledFast.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
      include: {
        reminders: true,
      },
    })

    if (!fast) {
      return NextResponse.json({ error: 'Scheduled fast not found' }, { status: 404 })
    }

    return NextResponse.json(fast)
  } catch (error) {
    console.error('Failed to fetch scheduled fast:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled fast' },
      { status: 500 }
    )
  }
}

// PATCH /api/schedule/fasts/[id] - Update a scheduled fast
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = updateScheduledFastSchema.parse(body)

    // Check if fast exists and belongs to user
    const existingFast = await prisma.scheduledFast.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existingFast) {
      return NextResponse.json({ error: 'Scheduled fast not found' }, { status: 404 })
    }

    // Update the fast
    const updatedData: any = {}
    if (validatedData.type !== undefined) updatedData.type = validatedData.type
    if (validatedData.scheduledStart !== undefined) updatedData.scheduledStart = new Date(validatedData.scheduledStart)
    if (validatedData.scheduledEnd !== undefined) updatedData.scheduledEnd = new Date(validatedData.scheduledEnd)
    if (validatedData.isRecurring !== undefined) updatedData.isRecurring = validatedData.isRecurring
    if (validatedData.recurrencePattern !== undefined) updatedData.recurrencePattern = validatedData.recurrencePattern
    if (validatedData.notes !== undefined) updatedData.notes = validatedData.notes

    const updatedFast = await prisma.scheduledFast.update({
      where: { id: id },
      data: updatedData,
      include: {
        reminders: true,
      },
    })

    // If updating a recurring fast, ask user if they want to update all instances
    // This would be handled in the frontend with a confirmation dialog

    return NextResponse.json(updatedFast)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Failed to update scheduled fast:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled fast' },
      { status: 500 }
    )
  }
}

// DELETE /api/schedule/fasts/[id] - Delete a scheduled fast
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    const { id } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if fast exists and belongs to user
    const existingFast = await prisma.scheduledFast.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existingFast) {
      return NextResponse.json({ error: 'Scheduled fast not found' }, { status: 404 })
    }

    // Delete associated reminders first
    await prisma.reminder.deleteMany({
      where: {
        scheduledFastId: id,
      },
    })

    // Delete the scheduled fast
    await prisma.scheduledFast.delete({
      where: { id: id },
    })

    // If this is a recurring fast, optionally delete all future instances
    // This would be handled via query parameter from frontend
    const deleteRecurring = req.nextUrl.searchParams.get('deleteRecurring') === 'true'
    if (deleteRecurring && existingFast.isRecurring && existingFast.parentId) {
      await prisma.scheduledFast.deleteMany({
        where: {
          parentId: existingFast.parentId,
          scheduledStart: {
            gte: new Date(),
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete scheduled fast:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled fast' },
      { status: 500 }
    )
  }
}