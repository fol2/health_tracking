import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { addMinutes, isBefore } from 'date-fns'

// Helper function to generate notification messages
const getNotificationMessage = (reminder: any): string => {
  switch (reminder.type) {
    case 'fast_start':
      if (reminder.scheduledFast) {
        const minutes = Math.round(
          (new Date(reminder.scheduledFast.scheduledStart).getTime() - Date.now()) / (1000 * 60)
        )
        return `Your ${reminder.scheduledFast.type} fast starts in ${minutes} minutes!`
      }
      return 'Your fast is starting soon!'
    
    case 'fast_end':
      return 'Congratulations! Your fast is complete!'
    
    case 'weight_check':
      return 'Time to log your weight for today!'
    
    case 'custom':
      return reminder.message || 'You have a reminder!'
    
    default:
      return 'You have a reminder!'
  }
}

// Validation schemas
const createReminderSchema = z.object({
  scheduledFastId: z.string().optional(),
  type: z.enum(['fast_start', 'fast_end', 'weight_check', 'custom']),
  reminderTime: z.string().datetime(),
  message: z.string().optional(),
})

const updateReminderSchema = z.object({
  isActive: z.boolean().optional(),
  isSent: z.boolean().optional(),
  sentAt: z.string().datetime().optional(),
})

// GET /api/reminders - Get user's reminders
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const action = searchParams.get('action')
    
    // Check for pending reminders to send
    if (action === 'check') {
      const now = new Date()
      const checkWindow = addMinutes(now, 5) // Check 5 minutes ahead

      const pendingReminders = await prisma.reminder.findMany({
        where: {
          userId: session.user.id,
          isActive: true,
          isSent: false,
          reminderTime: {
            gte: now,
            lte: checkWindow,
          },
        },
        include: {
          scheduledFast: true,
        },
      })

      const notifications = pendingReminders.map(reminder => ({
        id: reminder.id,
        type: reminder.type,
        message: getNotificationMessage(reminder),
        scheduledTime: reminder.reminderTime,
        fast: reminder.scheduledFast,
      }))

      return NextResponse.json({ notifications })
    }
    
    // Default: Get user's reminders
    const active = searchParams.get('active') === 'true'
    const pending = searchParams.get('pending') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {
      userId: session.user.id,
    }

    if (active) {
      where.isActive = true
    }

    if (pending) {
      where.isSent = false
      where.reminderTime = {
        gte: new Date(),
      }
    }

    const reminders = await prisma.reminder.findMany({
      where,
      orderBy: { reminderTime: 'asc' },
      take: limit,
      include: {
        scheduledFast: true,
      },
    })

    return NextResponse.json({ reminders })
  } catch (error) {
    console.error('Failed to fetch reminders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    )
  }
}

// POST /api/reminders - Create a reminder
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createReminderSchema.parse(body)

    // If scheduledFastId is provided, verify it belongs to the user
    if (validatedData.scheduledFastId) {
      const fast = await prisma.scheduledFast.findFirst({
        where: {
          id: validatedData.scheduledFastId,
          userId: session.user.id,
        },
      })

      if (!fast) {
        return NextResponse.json(
          { error: 'Scheduled fast not found' },
          { status: 404 }
        )
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        userId: session.user.id,
        scheduledFastId: validatedData.scheduledFastId,
        type: validatedData.type,
        reminderTime: new Date(validatedData.reminderTime),
        isActive: true,
        isSent: false,
      },
    })

    return NextResponse.json(reminder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Failed to create reminder:', error)
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    )
  }
}

// PATCH /api/reminders?id={id} - Update a reminder
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Reminder ID required' }, { status: 400 })
    }

    const body = await req.json()
    const validatedData = updateReminderSchema.parse(body)

    // Verify reminder belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    const updateData: any = {}
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive
    if (validatedData.isSent !== undefined) updateData.isSent = validatedData.isSent
    if (validatedData.sentAt !== undefined) updateData.sentAt = new Date(validatedData.sentAt)

    const updatedReminder = await prisma.reminder.update({
      where: { id: id },
      data: updateData,
    })

    return NextResponse.json(updatedReminder)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Failed to update reminder:', error)
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    )
  }
}

// DELETE /api/reminders?id={id} - Delete a reminder
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Reminder ID required' }, { status: 400 })
    }

    // Verify reminder belongs to user
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: id,
        userId: session.user.id,
      },
    })

    if (!existingReminder) {
      return NextResponse.json({ error: 'Reminder not found' }, { status: 404 })
    }

    await prisma.reminder.delete({
      where: { id: id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete reminder:', error)
    return NextResponse.json(
      { error: 'Failed to delete reminder' },
      { status: 500 }
    )
  }
}

