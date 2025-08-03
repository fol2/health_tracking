import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay } from 'date-fns'
import { z } from 'zod'

// Schema for generating recurring instances
const generateRecurringSchema = z.object({
  parentId: z.string(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).optional(),
})

// POST /api/schedule/recurring - Generate recurring fast instances
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { parentId, from, to, limit } = generateRecurringSchema.parse(body)

    // Get the parent scheduled fast
    const parentFast = await prisma.scheduledFast.findFirst({
      where: {
        id: parentId,
        userId: session.user.id,
        isRecurring: true,
      },
    })

    if (!parentFast || !parentFast.recurrencePattern) {
      return NextResponse.json(
        { error: 'Parent recurring fast not found' },
        { status: 404 }
      )
    }

    const pattern = parentFast.recurrencePattern as any
    const fromDate = from ? new Date(from) : new Date()
    const toDate = to ? new Date(to) : addMonths(fromDate, 3) // Default 3 months
    const maxInstances = limit || 50

    const instances = await generateRecurringInstances(
      session.user.id,
      parentFast,
      pattern,
      fromDate,
      toDate,
      maxInstances
    )

    return NextResponse.json({ instances })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Failed to generate recurring instances:', error)
    return NextResponse.json(
      { error: 'Failed to generate recurring instances' },
      { status: 500 }
    )
  }
}

// GET /api/schedule/recurring - Get all recurring fast patterns
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all parent recurring fasts
    const recurringFasts = await prisma.scheduledFast.findMany({
      where: {
        userId: session.user.id,
        isRecurring: true,
        parentId: null, // Only get parent fasts, not instances
      },
      orderBy: { scheduledStart: 'asc' },
      include: {
        _count: {
          select: {
            children: true, // Count how many instances exist
          },
        },
      },
    })

    return NextResponse.json({ recurringFasts })
  } catch (error) {
    console.error('Failed to fetch recurring fasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch recurring fasts' },
      { status: 500 }
    )
  }
}

// Helper function to generate recurring instances
async function generateRecurringInstances(
  userId: string,
  parentFast: any,
  pattern: any,
  fromDate: Date,
  toDate: Date,
  maxInstances: number
) {
  const { frequency, interval, daysOfWeek, endDate } = pattern
  const instances: any[] = []
  
  // Start from the original date or the fromDate, whichever is later
  let currentStart = new Date(parentFast.scheduledStart)
  let currentEnd = new Date(parentFast.scheduledEnd)
  
  // Skip to the fromDate if needed
  while (isBefore(currentStart, fromDate)) {
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
  }

  // Generate instances
  let count = 0
  const limitDate = endDate ? new Date(endDate) : toDate

  while (count < maxInstances && isBefore(currentStart, toDate) && isBefore(currentStart, limitDate)) {
    // For weekly recurrence with specific days
    if (frequency === 'weekly' && daysOfWeek && daysOfWeek.length > 0) {
      const dayOfWeek = currentStart.getDay()
      if (!daysOfWeek.includes(dayOfWeek)) {
        // Skip this day and continue
        currentStart = addDays(currentStart, 1)
        currentEnd = addDays(currentEnd, 1)
        continue
      }
    }

    // Check if instance already exists
    const existingInstance = await prisma.scheduledFast.findFirst({
      where: {
        userId,
        parentId: parentFast.id,
        scheduledStart: currentStart,
      },
    })

    if (!existingInstance) {
      // Create the instance
      const instance = await prisma.scheduledFast.create({
        data: {
          userId,
          type: parentFast.type,
          scheduledStart: currentStart,
          scheduledEnd: currentEnd,
          isRecurring: true,
          recurrencePattern: pattern,
          parentId: parentFast.id,
          notes: parentFast.notes,
        },
      })

      instances.push(instance)
    }

    count++

    // Move to next occurrence
    if (frequency === 'daily') {
      currentStart = addDays(currentStart, interval)
      currentEnd = addDays(currentEnd, interval)
    } else if (frequency === 'weekly') {
      if (daysOfWeek && daysOfWeek.length > 0) {
        // For weekly with specific days, move to next week
        currentStart = addWeeks(currentStart, interval)
        currentEnd = addWeeks(currentEnd, interval)
      } else {
        currentStart = addWeeks(currentStart, interval)
        currentEnd = addWeeks(currentEnd, interval)
      }
    } else if (frequency === 'monthly') {
      currentStart = addMonths(currentStart, interval)
      currentEnd = addMonths(currentEnd, interval)
    }
  }

  return instances
}