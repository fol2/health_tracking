import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test basic database connection
    const userCount = await prisma.user.count()
    
    // Check if ScheduledFast table exists
    let scheduledFastExists = false
    let scheduledFastCount = 0
    
    try {
      scheduledFastCount = await prisma.scheduledFast.count()
      scheduledFastExists = true
    } catch (error) {
      console.error('ScheduledFast table error:', error)
    }
    
    return NextResponse.json({
      success: true,
      database: 'connected',
      userCount,
      scheduledFastExists,
      scheduledFastCount,
    })
  } catch (error) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 })
  }
}