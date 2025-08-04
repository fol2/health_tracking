import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const now = new Date()
    const endDate = addDays(now, 7) // Get fasts for the next 7 days

    const upcomingFasts = await prisma.scheduledFast.findMany({
      where: {
        userId: session.user.id,
        scheduledStart: {
          gte: now,
          lte: endDate,
        },
        isActive: true,
      },
      orderBy: {
        scheduledStart: 'asc',
      },
      include: {
        reminders: true,
      },
    })

    return NextResponse.json(upcomingFasts)
  } catch (error) {
    console.error('Failed to fetch upcoming fasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming fasts' },
      { status: 500 }
    )
  }
}