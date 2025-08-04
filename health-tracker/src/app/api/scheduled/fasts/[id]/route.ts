import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// PUT /api/scheduled/fasts/[id] - Update a scheduled fast
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if the scheduled fast belongs to the user
    const existingFast = await prisma.scheduledFast.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    })

    if (!existingFast) {
      return NextResponse.json({ error: 'Scheduled fast not found' }, { status: 404 })
    }

    // Update the scheduled fast
    const updatedFast = await prisma.scheduledFast.update({
      where: { id },
      data: {
        type: body.type,
        scheduledStart: body.scheduledStart ? new Date(body.scheduledStart) : undefined,
        scheduledEnd: body.scheduledEnd ? new Date(body.scheduledEnd) : undefined,
        isRecurring: body.isRecurring,
        recurrencePattern: body.recurrencePattern 
          ? JSON.stringify(body.recurrencePattern)
          : undefined,
        notes: body.notes,
      },
    })

    return NextResponse.json(updatedFast)
  } catch (error) {
    console.error('Failed to update scheduled fast:', error)
    return NextResponse.json(
      { error: 'Failed to update scheduled fast' },
      { status: 500 }
    )
  }
}

// DELETE /api/scheduled/fasts/[id] - Delete a scheduled fast
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if the scheduled fast belongs to the user
    const existingFast = await prisma.scheduledFast.findFirst({
      where: {
        id,
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
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete scheduled fast:', error)
    return NextResponse.json(
      { error: 'Failed to delete scheduled fast' },
      { status: 500 }
    )
  }
}