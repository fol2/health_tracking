import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const scheduledFasts = await prisma.scheduledFast.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        reminders: true,
      },
    })

    console.log(`Found ${scheduledFasts.length} scheduled fasts for user ${session.user.id}`)
    return NextResponse.json(scheduledFasts)
  } catch (error) {
    console.error('Failed to fetch scheduled fasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch scheduled fasts' },
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
    
    // Validate input
    const validatedData = createScheduledFastSchema.parse(body)

    // Create scheduled fast
    const scheduledFast = await prisma.scheduledFast.create({
      data: {
        userId: session.user.id,
        type: validatedData.type,
        scheduledStart: new Date(validatedData.scheduledStart),
        scheduledEnd: new Date(validatedData.scheduledEnd),
        isRecurring: validatedData.isRecurring || false,
        recurrencePattern: validatedData.recurrencePattern 
          ? JSON.stringify(validatedData.recurrencePattern)
          : undefined,
        notes: validatedData.notes,
      },
    })

    console.log('Created scheduled fast:', scheduledFast.id, 'for user:', session.user.id)

    // Create reminder if specified
    if (validatedData.reminderTime) {
      const reminderTime = new Date(validatedData.scheduledStart)
      reminderTime.setMinutes(reminderTime.getMinutes() - validatedData.reminderTime)

      await prisma.reminder.create({
        data: {
          userId: session.user.id,
          scheduledFastId: scheduledFast.id,
          reminderTime,
          type: 'fast_start',
        },
      })
    }

    return NextResponse.json(scheduledFast, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }
    
    console.error('Failed to create scheduled fast:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create scheduled fast', details: errorMessage },
      { status: 500 }
    )
  }
}