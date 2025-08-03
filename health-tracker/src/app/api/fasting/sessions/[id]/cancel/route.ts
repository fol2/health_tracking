import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FastingService } from '@/lib/services/fasting.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await auth()
    const { id } = await params
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const cancelledSession = await FastingService.updateSession(
      id,
      session.user.id,
      {
        status: 'cancelled',
        endTime: new Date(),
      }
    )

    return NextResponse.json(cancelledSession)
  } catch (error) {
    console.error('Error cancelling fasting session:', error)
    return NextResponse.json(
      { error: 'Failed to cancel session' },
      { status: 500 }
    )
  }
}