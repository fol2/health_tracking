import { prisma } from '@/lib/db'
import type { 
  CreateScheduledFastInput,
  RecurrencePattern,
  ReminderType
} from '@/types/database'

export class ScheduleService {
  /**
   * Create a scheduled fast
   */
  static async createScheduledFast(userId: string, data: CreateScheduledFastInput) {
    const scheduledFast = await prisma.scheduledFast.create({
      data: {
        userId,
        ...data,
        recurrencePattern: data.recurrencePattern 
          ? JSON.stringify(data.recurrencePattern)
          : undefined,
      },
    })

    // Create reminder if specified
    if (data.reminderTime) {
      const reminderTime = new Date(data.scheduledStart)
      reminderTime.setMinutes(reminderTime.getMinutes() - data.reminderTime)

      await prisma.reminder.create({
        data: {
          userId,
          scheduledFastId: scheduledFast.id,
          reminderTime,
          type: 'fast_start' as ReminderType,
        },
      })
    }

    return scheduledFast
  }

  /**
   * Get upcoming scheduled fasts
   */
  static async getUpcomingFasts(userId: string, days = 7) {
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + days)

    return prisma.scheduledFast.findMany({
      where: {
        userId,
        isActive: true,
        scheduledStart: {
          gte: new Date(),
          lte: endDate,
        },
      },
      include: {
        reminders: {
          where: { isSent: false },
        },
      },
      orderBy: { scheduledStart: 'asc' },
    })
  }

  /**
   * Update scheduled fast
   */
  static async updateScheduledFast(
    fastId: string,
    userId: string,
    data: Partial<CreateScheduledFastInput>
  ) {
    return prisma.scheduledFast.update({
      where: {
        id: fastId,
        userId,
      },
      data: {
        ...data,
        recurrencePattern: data.recurrencePattern
          ? JSON.stringify(data.recurrencePattern)
          : undefined,
      },
    })
  }

  /**
   * Cancel scheduled fast
   */
  static async cancelScheduledFast(fastId: string, userId: string) {
    return prisma.scheduledFast.update({
      where: {
        id: fastId,
        userId,
      },
      data: {
        isActive: false,
      },
    })
  }

  /**
   * Get pending reminders
   */
  static async getPendingReminders(userId: string) {
    const now = new Date()
    const fifteenMinutesFromNow = new Date(now.getTime() + 15 * 60 * 1000)

    return prisma.reminder.findMany({
      where: {
        userId,
        isSent: false,
        reminderTime: {
          gte: now,
          lte: fifteenMinutesFromNow,
        },
      },
      include: {
        scheduledFast: true,
      },
    })
  }

  /**
   * Mark reminder as sent
   */
  static async markReminderSent(reminderId: string) {
    return prisma.reminder.update({
      where: { id: reminderId },
      data: {
        isSent: true,
        sentAt: new Date(),
      },
    })
  }

  /**
   * Generate recurring fast instances
   */
  static async generateRecurringInstances(
    scheduledFastId: string,
    userId: string,
    daysAhead = 30
  ) {
    const scheduledFast = await prisma.scheduledFast.findUnique({
      where: {
        id: scheduledFastId,
        userId,
      },
    })

    if (!scheduledFast || !scheduledFast.isRecurring || !scheduledFast.recurrencePattern) {
      return []
    }

    const pattern: RecurrencePattern = typeof scheduledFast.recurrencePattern === 'string' 
      ? JSON.parse(scheduledFast.recurrencePattern)
      : scheduledFast.recurrencePattern as unknown as RecurrencePattern
    const instances: Date[] = []
    const currentDate = new Date(scheduledFast.scheduledStart)
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + daysAhead)

    if (pattern.endDate && new Date(pattern.endDate) < endDate) {
      endDate.setTime(new Date(pattern.endDate).getTime())
    }

    while (currentDate <= endDate) {
      switch (pattern.frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + pattern.interval)
          break
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (pattern.interval * 7))
          break
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + pattern.interval)
          break
      }

      if (currentDate <= endDate) {
        instances.push(new Date(currentDate))
      }
    }

    return instances
  }
}