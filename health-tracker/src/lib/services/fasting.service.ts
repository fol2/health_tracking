import { prisma } from '@/lib/db'
import type { 
  CreateFastingSessionInput, 
  UpdateFastingSessionInput,
  FastingStatus 
} from '@/types/database'

export class FastingService {
  /**
   * Create a new fasting session
   */
  static async createSession(userId: string, data: CreateFastingSessionInput) {
    // Check if user has an active session
    const activeSession = await prisma.fastingSession.findFirst({
      where: {
        userId,
        status: 'active',
      },
    })

    if (activeSession) {
      throw new Error('User already has an active fasting session')
    }

    return prisma.fastingSession.create({
      data: {
        userId,
        ...data,
      },
    })
  }

  /**
   * Update a fasting session
   */
  static async updateSession(
    sessionId: string,
    userId: string,
    data: UpdateFastingSessionInput
  ) {
    return prisma.fastingSession.update({
      where: {
        id: sessionId,
        userId, // Ensure user owns the session
      },
      data,
    })
  }

  /**
   * End a fasting session
   */
  static async endSession(sessionId: string, userId: string) {
    return prisma.fastingSession.update({
      where: {
        id: sessionId,
        userId,
        status: 'active',
      },
      data: {
        endTime: new Date(),
        status: 'completed' as FastingStatus,
      },
    })
  }

  /**
   * Get active fasting session for a user
   */
  static async getActiveSession(userId: string) {
    return prisma.fastingSession.findFirst({
      where: {
        userId,
        status: 'active',
      },
    })
  }

  /**
   * Get fasting history for a user
   */
  static async getUserSessions(
    userId: string,
    limit = 20,
    offset = 0
  ) {
    const [sessions, total] = await Promise.all([
      prisma.fastingSession.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.fastingSession.count({
        where: { userId },
      }),
    ])

    return { sessions, total }
  }

  /**
   * Get fasting statistics for a user
   */
  static async getUserStats(userId: string) {
    const sessions = await prisma.fastingSession.findMany({
      where: {
        userId,
        status: 'completed',
      },
      orderBy: { startTime: 'desc' },
    })

    if (sessions.length === 0) {
      return {
        totalSessions: 0,
        totalHours: 0,
        averageHours: 0,
        longestFast: 0,
        currentStreak: 0,
        longestStreak: 0,
      }
    }

    // Calculate total hours
    const totalHours = sessions.reduce((sum, session) => {
      if (session.endTime) {
        const duration = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)
        return sum + duration
      }
      return sum
    }, 0)

    // Calculate longest fast
    const longestFast = Math.max(...sessions.map(session => {
      if (session.endTime) {
        return (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60 * 60)
      }
      return 0
    }))

    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(sessions)

    // Calculate completion rate
    const allSessions = await prisma.fastingSession.findMany({
      where: { userId },
    })
    const completedSessions = allSessions.filter(s => s.status === 'completed').length
    const completionRate = allSessions.length > 0
      ? Math.round((completedSessions / allSessions.length) * 100)
      : 0

    return {
      totalSessions: sessions.length,
      totalHours: Math.round(totalHours),
      averageHours: Math.round(totalHours / sessions.length),
      longestFast: Math.round(longestFast),
      currentStreak,
      longestStreak,
      completionRate,
    }
  }

  /**
   * Calculate current and longest streak
   */
  private static calculateStreaks(sessions: Array<{ startTime: Date }>) {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 }

    // Sort sessions by date
    const sortedSessions = [...sessions].sort((a, b) => 
      b.startTime.getTime() - a.startTime.getTime()
    )

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 1
    let lastDate = new Date(sortedSessions[0].startTime)
    lastDate.setHours(0, 0, 0, 0)

    // Check if the most recent session was today or yesterday for current streak
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (lastDate.getTime() === today.getTime() || lastDate.getTime() === yesterday.getTime()) {
      currentStreak = 1
    }

    // Calculate streaks
    for (let i = 1; i < sortedSessions.length; i++) {
      const sessionDate = new Date(sortedSessions[i].startTime)
      sessionDate.setHours(0, 0, 0, 0)

      const dayDiff = (lastDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)

      if (dayDiff === 1) {
        tempStreak++
        if (currentStreak > 0 && i < sessions.length) {
          currentStreak = tempStreak
        }
      } else {
        longestStreak = Math.max(longestStreak, tempStreak)
        tempStreak = 1
      }

      lastDate = sessionDate
    }

    longestStreak = Math.max(longestStreak, tempStreak)

    return { currentStreak, longestStreak }
  }
}