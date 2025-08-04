import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, differenceInHours } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        profile: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch all data for the period
    const [weightRecords, fastingSessions, healthMetrics] = await Promise.all([
      prisma.weightRecord.findMany({
        where: {
          userId: user.id,
          recordedAt: {
            gte: startOfDay(new Date(startDate)),
            lte: endOfDay(new Date(endDate)),
          },
        },
        orderBy: { recordedAt: 'asc' },
      }),
      prisma.fastingSession.findMany({
        where: {
          userId: user.id,
          startTime: {
            gte: startOfDay(new Date(startDate)),
            lte: endOfDay(new Date(endDate)),
          },
        },
      }),
      prisma.healthMetric.findMany({
        where: {
          userId: user.id,
          recordedAt: {
            gte: startOfDay(new Date(startDate)),
            lte: endOfDay(new Date(endDate)),
          },
        },
      }),
    ])

    // Calculate weight progress
    const latestWeight = weightRecords[weightRecords.length - 1]?.weight || 0
    const startWeight = weightRecords[0]?.weight || latestWeight
    const weightChange = latestWeight - startWeight
    const weightChangePercent = startWeight > 0 ? (weightChange / startWeight) * 100 : 0

    // Calculate fasting stats
    let totalFastingHours = 0
    let completedFasts = 0
    
    fastingSessions.forEach(session => {
      if (session.status === 'completed' && session.endTime) {
        totalFastingHours += differenceInHours(session.endTime, session.startTime)
        completedFasts++
      } else if (session.status === 'active') {
        // Include active session hours
        totalFastingHours += differenceInHours(new Date(), session.startTime)
      }
    })

    const avgFastingDuration = completedFasts > 0 ? totalFastingHours / completedFasts : 0

    // Calculate streak
    let currentStreak = 0
    const today = startOfDay(new Date())
    const sortedSessions = fastingSessions
      .filter(s => s.status === 'completed')
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())

    if (sortedSessions.length > 0) {
      const lastSession = sortedSessions[0]
      const daysSinceLastFast = Math.floor(
        (today.getTime() - startOfDay(lastSession.startTime).getTime()) / (1000 * 60 * 60 * 24)
      )
      
      if (daysSinceLastFast <= 1) {
        currentStreak = 1
        // Count consecutive days backwards
        for (let i = 1; i < sortedSessions.length; i++) {
          const prevDay = startOfDay(sortedSessions[i - 1].startTime)
          const currentDay = startOfDay(sortedSessions[i].startTime)
          const dayDiff = Math.floor(
            (prevDay.getTime() - currentDay.getTime()) / (1000 * 60 * 60 * 24)
          )
          
          if (dayDiff === 1) {
            currentStreak++
          } else {
            break
          }
        }
      }
    }

    // Calculate health metrics averages
    const heartRateMetrics = healthMetrics.filter(m => m.metricType === 'heart_rate')
    const bpMetrics = healthMetrics.filter(m => m.metricType === 'blood_pressure')
    const sleepMetrics = healthMetrics.filter(m => m.metricType === 'sleep')
    const energyMetrics = healthMetrics.filter(m => m.metricType === 'energy')

    const avgHeartRate = heartRateMetrics.reduce((sum, m) => {
      const value = m.value as any
      return sum + (value.value || value || 0)
    }, 0) / (heartRateMetrics.length || 1)

    let avgSystolic = 0
    let avgDiastolic = 0
    if (bpMetrics.length > 0) {
      bpMetrics.forEach(m => {
        const value = m.value as any
        avgSystolic += value.systolic || 0
        avgDiastolic += value.diastolic || 0
      })
      avgSystolic /= bpMetrics.length
      avgDiastolic /= bpMetrics.length
    }

    const avgSleepHours = sleepMetrics.reduce((sum, m) => {
      const value = m.value as any
      return sum + (value.hours || value.duration || value || 0)
    }, 0) / (sleepMetrics.length || 1)

    const avgEnergyLevel = energyMetrics.reduce((sum, m) => {
      const value = m.value as any
      return sum + (value.level || value || 0)
    }, 0) / (energyMetrics.length || 1)

    // Calculate achievements
    const achievements = [
      {
        title: 'Weight Goal Progress',
        description: user.profile?.targetWeight 
          ? `${Math.abs(latestWeight - user.profile.targetWeight).toFixed(1)} kg from target`
          : 'Set a target weight',
        icon: 'scale',
        achieved: user.profile?.targetWeight 
          ? Math.abs(latestWeight - user.profile.targetWeight) < 1
          : false,
      },
      {
        title: 'Fasting Streak',
        description: `${currentStreak} day${currentStreak !== 1 ? 's' : ''} consecutive`,
        icon: 'clock',
        achieved: currentStreak >= 7,
      },
      {
        title: 'Total Fasting Hours',
        description: `${totalFastingHours.toFixed(0)} hours completed`,
        icon: 'award',
        achieved: totalFastingHours >= 100,
      },
      {
        title: 'Health Tracking',
        description: `${healthMetrics.length} measurements recorded`,
        icon: 'heart',
        achieved: healthMetrics.length >= 20,
      },
    ]

    // Calculate completion rate
    const scheduledFasts = await prisma.scheduledFast.count({
      where: {
        userId: user.id,
        scheduledStart: {
          gte: startOfDay(new Date(startDate)),
          lte: endOfDay(new Date(endDate)),
        },
      },
    })

    const completionRate = scheduledFasts > 0 
      ? (completedFasts / scheduledFasts) * 100 
      : 100

    return NextResponse.json({
      weightProgress: {
        current: latestWeight,
        target: user.profile?.targetWeight || null,
        change: weightChange,
        changePercent: weightChangePercent,
        trend: weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable',
      },
      fastingStats: {
        totalHours: totalFastingHours,
        averageDuration: avgFastingDuration,
        completionRate: completionRate,
        currentStreak: currentStreak,
      },
      healthMetrics: {
        avgHeartRate: Math.round(avgHeartRate),
        avgBloodPressure: {
          systolic: Math.round(avgSystolic),
          diastolic: Math.round(avgDiastolic),
        },
        avgSleepHours: avgSleepHours,
        avgEnergyLevel: avgEnergyLevel,
      },
      achievements,
    })
  } catch (error) {
    console.error('Error fetching summary data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch summary data' },
      { status: 500 }
    )
  }
}