import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { prisma } from '@/lib/db'

interface RouteParams {
  params: Promise<{
    type: string
  }>
}

// GET /api/health/metrics/[type] - Get metrics by type
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession()
    const { type } = await params
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '30')

    const metrics = await prisma.healthMetric.findMany({
      where: {
        userId: session.user.id,
        metricType: type,
      },
      orderBy: {
        recordedAt: 'desc',
      },
      take: limit,
    })

    return NextResponse.json({ metrics })
  } catch (error) {
    console.error('Failed to fetch metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}