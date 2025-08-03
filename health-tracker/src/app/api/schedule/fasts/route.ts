import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { startOfDay, endOfDay, addDays, addWeeks, addMonths } from 'date-fns'

// Validation schema
const createScheduledFastSchema = z.object({
  type: z.string(),
  scheduledStart: z.string().datetime(),
  scheduledEnd: z.string().datetime(),
  isRecurring: z.boolean().optional(),
  recurrencePattern: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly']),
    interval: z.number().min(1).max(30),
    daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
  reminderTime: z.number().min(5).max(1440).optional(),
  notes: z.string().optional(),
})

// GET /api/schedule/fasts - Get all scheduled fasts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const where: any = {
      userId: session.user.id,
    }

    // Add date range filter if provided
    if (from || to) {
      where.scheduledStart = {}
      if (from) {
        where.scheduledStart.gte = new Date(from)
      }
      if (to) {
        where.scheduledStart.lte = new Date(to)
      }
    }

    const fasts = await prisma.scheduledFast.findMany({
      where,
      orderBy: { scheduledStart: 'asc' },
      include: {
        reminders: true,
      },
    })

    return NextResponse.json({ fasts })
  } catch (error) {
    console.error('Failed to fetch scheduled fasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled fasts' },
      { status: 500 }
    )
  }
}

// POST /api/schedule/fasts - Create a scheduled fast
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = createScheduledFastSchema.parse(body)

    // Create scheduled fast
    const scheduledFast = await prisma.scheduledFast.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        scheduledStart: new Date(validatedData.scheduledStart),
        scheduledEnd: new Date(validatedData.scheduledEnd),
        isRecurring: validatedData.isRecurring || false,
        recurrencePattern: validatedData.recurrencePattern || {},
        notes: validatedData.notes,
      },
      include: {
        reminders: true,
      },
    })

    // Create reminder if requested
    if (validatedData.reminderTime) {
      const reminderDate = new Date(validatedData.scheduledStart)
      reminderDate.setMinutes(reminderDate.getMinutes() - validatedData.reminderTime)

      await prisma.reminder.create({
        data: {
          userId: session.user.id,
          scheduledFastId: scheduledFast.id,
          reminderTime: reminderDate,
          type: 'fast_start',
          isActive: true,
        },
      })
    }

    // If recurring, create additional instances
    if (validatedData.isRecurring && validatedData.recurrencePattern) {
      await createRecurringInstances(
        session.user.id,
        scheduledFast,
        validatedData.recurrencePattern,
        validatedData.reminderTime
      )
    }

    return NextResponse.json(scheduledFast)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Failed to create scheduled fast:', error)
    return NextResponse.json(
      { error: 'Failed to create scheduled fast' },
      { status: 500 }
    )
  }
}

// Helper function to create recurring instances
async function createRecurringInstances(
  userId: string,
  originalFast: any,
  pattern: any,
  reminderTime?: number
) {
  const { frequency, interval, daysOfWeek, endDate } = pattern
  const maxInstances = 52 // Limit to 1 year of instances
  const instances: any[] = []
  
  let currentStart = new Date(originalFast.scheduledStart)
  let currentEnd = new Date(originalFast.scheduledEnd)
  const limitDate = endDate ? new Date(endDate) : addDays(currentStart, 365)
  
  for (let i = 0; i < maxInstances; i++) {
    // Calculate next occurrence
    if (frequency === 'daily') {
      currentStart = addDays(currentStart, interval)
      currentEnd = addDays(currentEnd, interval)
    } else if (frequency === 'weekly') {
      currentStart = addWeeks(currentStart, interval)
      currentEnd = addWeeks(currentEnd, interval)
    } else if (frequency === 'monthly') {
      currentStart = addMonths(currentStart, interval)
      currentEnd = addMonths(currentEnd, interval)
    }

    // Check if we've passed the end date
    if (currentStart > limitDate) {
      break
    }

    // For weekly recurrence with specific days
    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      const dayOfWeek = currentStart.getDay()
      if (!daysOfWeek.includes(dayOfWeek)) {
        continue
      }
    }

    // Create the instance
    const instance = await prisma.scheduledFast.create({
      data: {
        userId,
        type: originalFast.type,
        scheduledStart: currentStart,
        scheduledEnd: currentEnd,
        isRecurring: true,
        recurrencePattern: pattern,
        parentId: originalFast.id,
        notes: originalFast.notes,
      },
    })

    // Create reminder for this instance
    if (reminderTime) {
      const reminderDate = new Date(currentStart)
      reminderDate.setMinutes(reminderDate.getMinutes() - reminderTime)

      await prisma.reminder.create({
        data: {
          userId,
          scheduledFastId: instance.id,
          reminderTime: reminderDate,
          type: 'fast_start',
          isActive: true,
        },
      })
    }

    instances.push(instance)
  }

  return instances
}