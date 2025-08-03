import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

// GET /api/health/latest - Get latest readings for all metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get latest weight
    const latestWeight = await prisma.weightRecord.findFirst({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        recordedAt: 'desc',
      },
    })

    // Get distinct metric types
    const metricTypes = await prisma.healthMetric.findMany({
      where: {
        userId: session.user.id,
      },
      distinct: ['metricType'],
      select: {
        metricType: true,
      },
    })

    // Get latest metric for each type
    const latestMetrics: Record<string, any> = {}
    
    for (const { metricType } of metricTypes) {
      const latest = await prisma.healthMetric.findFirst({
        where: {
          userId: session.user.id,
          metricType,
        },
        orderBy: {
          recordedAt: 'desc',
        },
      })
      
      if (latest) {
        latestMetrics[metricType] = latest
      }
    }

    return NextResponse.json({
      weight: latestWeight,
      metrics: latestMetrics,
    })
  } catch (error) {
    console.error('Failed to fetch latest readings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch latest readings' },
      { status: 500 }
    )
  }
}