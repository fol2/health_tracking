import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { startOfDay, endOfDay, format } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const metrics = searchParams.get('metrics')?.split(',') || ['blood_pressure', 'heart_rate']

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

    const healthMetrics = await prisma.healthMetric.findMany({
      where: {
        userId: user.id,
        metricType: {
          in: metrics,
        },
        recordedAt: {
          gte: startOfDay(new Date(startDate)),
          lte: endOfDay(new Date(endDate)),
        },
      },
      orderBy: {
        recordedAt: 'asc',
      },
    })

    // Group metrics by date
    const dataByDate: Record<string, any> = {}

    healthMetrics.forEach(metric => {
      const date = format(metric.recordedAt, 'MMM dd')
      
      if (!dataByDate[date]) {
        dataByDate[date] = {
          date,
        }
      }

      const value = metric.value as any

      switch (metric.metricType) {
        case 'blood_pressure':
          if (value.systolic && value.diastolic) {
            dataByDate[date].bloodPressureSystolic = value.systolic
            dataByDate[date].bloodPressureDiastolic = value.diastolic
          }
          break
        case 'heart_rate':
          dataByDate[date].heartRate = value.value || value
          break
        case 'sleep':
          dataByDate[date].sleepHours = value.hours || value.duration || value
          dataByDate[date].sleepQuality = value.quality
          break
        case 'energy':
          dataByDate[date].energyLevel = value.level || value
          break
      }
    })

    const chartData = Object.values(dataByDate).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    // Calculate correlations (simplified example)
    const correlations = calculateCorrelations(chartData)

    return NextResponse.json({
      chartData,
      correlations,
    })
  } catch (error) {
    console.error('Error fetching health analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch health analytics' },
      { status: 500 }
    )
  }
}

function calculateCorrelations(data: any[]) {
  // This is a simplified correlation calculation
  // In a real app, you'd use proper statistical methods
  
  const correlations: Record<string, any> = {}

  // Example: Sleep vs Energy correlation
  const sleepData = data.filter(d => d.sleepHours && d.energyLevel)
  if (sleepData.length > 2) {
    const avgSleep = sleepData.reduce((sum, d) => sum + d.sleepHours, 0) / sleepData.length
    const avgEnergy = sleepData.reduce((sum, d) => sum + d.energyLevel, 0) / sleepData.length
    
    let correlation = 0
    sleepData.forEach(d => {
      correlation += (d.sleepHours - avgSleep) * (d.energyLevel - avgEnergy)
    })
    
    correlations['Sleep vs Energy'] = {
      correlation: Math.min(Math.max(correlation / sleepData.length / 10, -1), 1),
      description: correlation > 0 
        ? 'More sleep is associated with higher energy levels'
        : 'Sleep and energy show inverse relationship',
    }
  }

  // Example: Heart Rate vs Blood Pressure
  const cardioData = data.filter(d => d.heartRate && d.bloodPressureSystolic)
  if (cardioData.length > 2) {
    const avgHR = cardioData.reduce((sum, d) => sum + d.heartRate, 0) / cardioData.length
    const avgBP = cardioData.reduce((sum, d) => sum + d.bloodPressureSystolic, 0) / cardioData.length
    
    let correlation = 0
    cardioData.forEach(d => {
      correlation += (d.heartRate - avgHR) * (d.bloodPressureSystolic - avgBP)
    })
    
    correlations['Heart Rate vs Blood Pressure'] = {
      correlation: Math.min(Math.max(correlation / cardioData.length / 100, -1), 1),
      description: correlation > 0 
        ? 'Higher heart rate is associated with higher blood pressure'
        : 'Heart rate and blood pressure show inverse relationship',
    }
  }

  return correlations
}