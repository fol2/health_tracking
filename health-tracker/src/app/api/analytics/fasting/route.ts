import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { 
  startOfDay, 
  endOfDay, 
  eachWeekOfInterval, 
  startOfWeek, 
  endOfWeek,
  differenceInHours,
  format
} from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const view = searchParams.get('view') || 'weekly'

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const fastingSessions = await prisma.fastingSession.findMany({
      where: {
        userId: user.id,
        startTime: {
          gte: startOfDay(new Date(startDate)),
          lte: endOfDay(new Date(endDate)),
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    })

    // Calculate statistics
    let totalHours = 0
    let completedSessions = 0
    const typeCount: Record<string, { count: number; totalHours: number }> = {}

    fastingSessions.forEach(session => {
      if (session.status === 'completed' && session.endTime) {
        const hours = differenceInHours(session.endTime, session.startTime)
        totalHours += hours
        completedSessions++

        if (!typeCount[session.type]) {
          typeCount[session.type] = { count: 0, totalHours: 0 }
        }
        typeCount[session.type].count++
        typeCount[session.type].totalHours += hours
      }
    })

    const averageDuration = completedSessions > 0 ? totalHours / completedSessions : 0

    // Calculate streaks
    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null

    fastingSessions
      .filter(s => s.status === 'completed')
      .forEach(session => {
        const sessionDate = startOfDay(session.startTime)
        
        if (!lastDate) {
          tempStreak = 1
        } else {
          const dayDiff = Math.floor(
            (sessionDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (dayDiff === 1) {
            tempStreak++
          } else if (dayDiff > 1) {
            longestStreak = Math.max(longestStreak, tempStreak)
            tempStreak = 1
          }
        }
        
        lastDate = sessionDate
      })

    longestStreak = Math.max(longestStreak, tempStreak)
    
    // Check if streak continues to today
    if (lastDate !== null) {
      const daysSinceLastFast = Math.floor((Date.now() - (lastDate as Date).getTime()) / (1000 * 60 * 60 * 24))
      if (daysSinceLastFast <= 1) {
        currentStreak = tempStreak
      }
    }

    // Calculate completion rate
    const scheduledFasts = await prisma.scheduledFast.findMany({
      where: {
        userId: user.id,
        scheduledStart: {
          gte: startOfDay(new Date(startDate)),
          lte: endOfDay(new Date(endDate)),
        },
      },
    })

    const completionRate = scheduledFasts.length > 0 
      ? (completedSessions / scheduledFasts.length) * 100 
      : 100

    // Prepare chart data based on view
    let chartData: any[] = []

    if (view === 'weekly') {
      const weeks = eachWeekOfInterval({
        start: new Date(startDate),
        end: new Date(endDate),
      })

      chartData = weeks.map(weekStart => {
        const weekEnd = endOfWeek(weekStart)
        const weekSessions = fastingSessions.filter(session => 
          session.startTime >= weekStart && session.startTime <= weekEnd
        )

        const weekHours = weekSessions.reduce((total, session) => {
          if (session.status === 'completed' && session.endTime) {
            return total + differenceInHours(session.endTime, session.startTime)
          }
          return total
        }, 0)

        return {
          date: format(weekStart, 'MMM dd'),
          totalHours: weekHours,
          completedSessions: weekSessions.filter(s => s.status === 'completed').length,
          completionRate: 100, // This would need scheduled fasts per week for accuracy
        }
      })
    }

    // Prepare type data
    const typeData = Object.entries(typeCount).map(([type, data]) => ({
      type,
      count: data.count,
      totalHours: data.totalHours,
      color: getColorForType(type),
    }))

    return NextResponse.json({
      chartData,
      typeData,
      stats: {
        totalHours,
        totalSessions: completedSessions,
        averageDuration,
        longestStreak,
        currentStreak,
        completionRate,
      },
    })
  } catch (error) {
    console.error('Error fetching fasting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch fasting analytics' },
      { status: 500 }
    )
  }
}

function getColorForType(type: string): string {
  const colors: Record<string, string> = {
    '16:8': '#8b5cf6',
    '18:6': '#3b82f6',
    '24h': '#10b981',
    '36h': '#f59e0b',
    '48h': '#ef4444',
    'custom': '#6b7280',
  }
  return colors[type] || '#6b7280'
}