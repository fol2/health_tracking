import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FastingService } from '@/lib/services/fasting.service'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await FastingService.getUserSessions(
      session.user.id,
      limit,
      offset
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching fasting sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { type, targetHours, notes, startTime } = body

    if (!type || !targetHours) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const fastingSession = await FastingService.createSession(session.user.id, {
      type,
      targetHours,
      notes,
      startTime: startTime || new Date(),
      status: 'active',
    })

    return NextResponse.json(fastingSession)
  } catch (error) {
    console.error('Error creating fasting session:', error)
    
    if (error instanceof Error && error.message.includes('already has an active')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}