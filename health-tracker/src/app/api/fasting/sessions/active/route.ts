import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FastingService } from '@/lib/services/fasting.service'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const activeSession = await FastingService.getActiveSession(session.user.id)

    if (!activeSession) {
      return NextResponse.json(null)
    }

    return NextResponse.json(activeSession)
  } catch (error) {
    console.error('Error fetching active session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch active session' },
      { status: 500 }
    )
  }
}