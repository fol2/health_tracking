import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'
import { z } from 'zod'

// Validation schema
const createMetricSchema = z.object({
  metricType: z.string().min(1),
  value: z.any(), // Flexible for different metric types
  unit: z.string().optional(),
  notes: z.string().optional(),
  recordedAt: z.string().datetime().optional(),
})

// GET /api/health/metrics - Get all metrics grouped by type
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const metrics = await prisma.healthMetric.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: 100, // Limit to recent 100 metrics
    })

    // Group metrics by type
    const metricsByType = metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = []
      }
      acc[metric.metricType].push(metric)
      return acc
    }, {} as Record<string, typeof metrics>)

    return NextResponse.json({ metricsByType })
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

// POST /api/health/metrics - Create health metric
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validated = createMetricSchema.parse(body)

    const metric = await prisma.healthMetric.create({
      data: {
        userId: session.user.id,
        metricType: validated.metricType,
        value: validated.value,
        unit: validated.unit,
        notes: validated.notes,
        recordedAt: validated.recordedAt ? new Date(validated.recordedAt) : new Date(),
      },
    })

    return NextResponse.json(metric)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Failed to create metric:', error)
    return NextResponse.json(
      { error: 'Failed to create metric' },
      { status: 500 }
    )
  }
}