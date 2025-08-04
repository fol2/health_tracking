import { prisma } from '@/lib/db'
import type { 
  CreateWeightRecordInput, 
  CreateHealthMetricInput,
  HealthMetricType 
} from '@/types/database'

export class HealthService {
  /**
   * Record weight
   */
  static async recordWeight(userId: string, data: CreateWeightRecordInput) {
    return prisma.weightRecord.create({
      data: {
        userId,
        ...data,
        recordedAt: data.recordedAt || new Date(),
      },
    })
  }

  /**
   * Get weight history
   */
  static async getWeightHistory(
    userId: string,
    days = 30
  ) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return prisma.weightRecord.findMany({
      where: {
        userId,
        recordedAt: {
          gte: startDate,
        },
      },
      orderBy: { recordedAt: 'desc' },
    })
  }

  /**
   * Get latest weight
   */
  static async getLatestWeight(userId: string) {
    return prisma.weightRecord.findFirst({
      where: { userId },
      orderBy: { recordedAt: 'desc' },
    })
  }

  /**
   * Record health metric
   */
  static async recordMetric(userId: string, data: CreateHealthMetricInput) {
    return prisma.healthMetric.create({
      data: {
        userId,
        ...data,
        recordedAt: data.recordedAt || new Date(),
      },
    })
  }

  /**
   * Get health metrics by type
   */
  static async getMetricsByType(
    userId: string,
    metricType: HealthMetricType,
    days = 30
  ) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    return prisma.healthMetric.findMany({
      where: {
        userId,
        metricType,
        recordedAt: {
          gte: startDate,
        },
      },
      orderBy: { recordedAt: 'desc' },
    })
  }

  /**
   * Get latest metrics
   */
  static async getLatestMetrics(userId: string) {
    const metricTypes: HealthMetricType[] = [
      'blood_pressure',
      'heart_rate',
      'blood_glucose',
      'body_temperature',
    ]

    const metrics = await Promise.all(
      metricTypes.map(type =>
        prisma.healthMetric.findFirst({
          where: {
            userId,
            metricType: type,
          },
          orderBy: { recordedAt: 'desc' },
        })
      )
    )

    return metrics.filter(Boolean)
  }

  /**
   * Get health summary
   */
  static async getHealthSummary(userId: string) {
    const [
      latestWeight,
      weightHistory,
      latestMetrics,
      profile,
    ] = await Promise.all([
      this.getLatestWeight(userId),
      this.getWeightHistory(userId, 30),
      this.getLatestMetrics(userId),
      prisma.userProfile.findUnique({ where: { userId } }),
    ])

    // Calculate weight change
    let weightChange: { amount: number; percentage: number } | null = null
    if (weightHistory.length >= 2) {
      const current = weightHistory[0].weight
      const previous = weightHistory[weightHistory.length - 1].weight
      weightChange = {
        amount: current - previous,
        percentage: ((current - previous) / previous) * 100,
      }
    }

    // Calculate progress to target
    let progressToTarget: { remaining: number; percentage: number } | null = null
    if (latestWeight && profile?.targetWeight) {
      const current = latestWeight.weight
      const target = profile.targetWeight
      progressToTarget = {
        remaining: Math.abs(current - target),
        percentage: Math.abs(((current - target) / target) * 100),
      }
    }

    return {
      currentWeight: latestWeight?.weight,
      targetWeight: profile?.targetWeight,
      weightChange,
      progressToTarget,
      latestMetrics,
    }
  }

  /**
   * Get recent activities
   */
  static async getRecentActivities(userId: string, limit = 10) {
    const [
      recentWeights,
      recentMetrics,
      recentFasts,
    ] = await Promise.all([
      prisma.weightRecord.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: limit,
      }),
      prisma.healthMetric.findMany({
        where: { userId },
        orderBy: { recordedAt: 'desc' },
        take: limit,
      }),
      prisma.fastingSession.findMany({
        where: { userId },
        orderBy: { startTime: 'desc' },
        take: limit,
      }),
    ])

    // Combine and sort all activities by date
    const activities = [
      ...recentWeights.map(w => ({
        type: 'weight' as const,
        date: w.recordedAt,
        data: w,
      })),
      ...recentMetrics.map(m => ({
        type: 'metric' as const,
        date: m.recordedAt,
        data: m,
      })),
      ...recentFasts.map(f => ({
        type: 'fasting' as const,
        date: f.startTime,
        data: f,
      })),
    ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit)

    return activities
  }
}