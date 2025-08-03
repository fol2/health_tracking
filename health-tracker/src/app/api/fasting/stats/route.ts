import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FastingService } from '@/lib/services/fasting.service'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await FastingService.getUserStats(session.user.id)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching fasting stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}