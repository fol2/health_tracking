import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'
import { addDays } from 'date-fns'

// GET /api/schedule/fasts/upcoming - Get upcoming scheduled fasts
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get upcoming fasts within the specified number of days
    const now = new Date()
    const endDate = addDays(now, days)

    const fasts = await prisma.scheduledFast.findMany({
      where: {
        userId: session.user.id,
        scheduledStart: {
          gte: now,
          lte: endDate,
        },
      },
      orderBy: { scheduledStart: 'asc' },
      take: limit,
      include: {
        reminders: {
          where: {
            isActive: true,
          },
        },
      },
    })

    return NextResponse.json({ fasts })
  } catch (error) {
    console.error('Failed to fetch upcoming fasts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch upcoming fasts' },
      { status: 500 }
    )
  }
}