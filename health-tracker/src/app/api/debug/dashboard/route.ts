import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { FastingService } from '@/lib/services/fasting.service'
import { HealthService } from '@/lib/services/health.service'
import { UserService } from '@/lib/services/user.service'
import { ScheduleService } from '@/lib/services/schedule.service'

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const results: any = {
      userId: session.user.id,
      timestamp: new Date().toISOString(),
      errors: []
    }

    // Test each service individually
    try {
      results.activeSession = await FastingService.getActiveSession(session.user.id!)
    } catch (error) {
      results.errors.push({ service: 'FastingService.getActiveSession', error: String(error) })
    }

    try {
      results.stats = await FastingService.getUserStats(session.user.id!)
    } catch (error) {
      results.errors.push({ service: 'FastingService.getUserStats', error: String(error) })
    }

    try {
      results.latestWeight = await HealthService.getLatestWeight(session.user.id!)
    } catch (error) {
      results.errors.push({ service: 'HealthService.getLatestWeight', error: String(error) })
    }

    try {
      results.profile = await UserService.getOrCreateProfile(session.user.id!)
    } catch (error) {
      results.errors.push({ service: 'UserService.getOrCreateProfile', error: String(error) })
    }

    try {
      results.upcomingFasts = await ScheduleService.getUpcomingFasts(session.user.id!, 7)
    } catch (error) {
      results.errors.push({ service: 'ScheduleService.getUpcomingFasts', error: String(error) })
    }

    try {
      results.weightHistory = await HealthService.getWeightHistory(session.user.id!, 30)
    } catch (error) {
      results.errors.push({ service: 'HealthService.getWeightHistory', error: String(error) })
    }

    try {
      results.recentActivities = await HealthService.getRecentActivities(session.user.id!, 10)
    } catch (error) {
      results.errors.push({ service: 'HealthService.getRecentActivities', error: String(error) })
    }

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug endpoint error', 
      message: String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}