'use client'

import { useEffect, useCallback } from 'react'
import { useScheduledFastsStore } from '@/store/scheduled-fasts-store'
import { useFastingSessionStore } from '@/store/fasting-session-store'
import { isWithinInterval, addMinutes, subMinutes } from 'date-fns'
import { toast } from 'sonner'

// Component to monitor and auto-start scheduled fasts
export function AutoStartMonitor() {
  const { scheduledFasts, fetchUpcomingFasts } = useScheduledFastsStore()
  const { activeSession, startSession } = useFastingSessionStore()

  const checkAndStartFasts = useCallback(async () => {
    if (activeSession) {
      // Don't auto-start if there's already an active session
      return
    }

    if (!scheduledFasts || !Array.isArray(scheduledFasts)) {
      // No scheduled fasts to check
      return
    }

    const now = new Date()
    const checkWindow = 5 // Minutes before/after scheduled time to auto-start

    for (const fast of scheduledFasts) {
      const scheduledStart = new Date(fast.scheduledStart)
      const windowStart = subMinutes(scheduledStart, checkWindow)
      const windowEnd = addMinutes(scheduledStart, checkWindow)

      // Check if current time is within the auto-start window
      if (isWithinInterval(now, { start: windowStart, end: windowEnd })) {
        // Check if this fast hasn't been started yet
        const fastKey = `autostart_${fast.id}_${scheduledStart.getTime()}`
        const hasStarted = localStorage.getItem(fastKey)

        if (!hasStarted) {
          // Show notification
          toast.info(`Auto-starting your ${fast.type} fast`, {
            description: 'Your scheduled fast is starting now',
            action: {
              label: 'Cancel',
              onClick: () => {
                // Mark as handled so it doesn't try again
                localStorage.setItem(fastKey, 'cancelled')
              },
            },
          })

          try {
            // Calculate duration
            const hours = Math.round(
              (new Date(fast.scheduledEnd).getTime() - scheduledStart.getTime()) / (1000 * 60 * 60)
            )

            // Start the session
            await startSession({
              type: fast.type,
              targetHours: hours,
              notes: fast.notes || `Auto-started from scheduled fast`,
            })

            // Mark as started
            localStorage.setItem(fastKey, 'started')

            // If not recurring, we might want to mark it as used
            // This depends on business logic
          } catch (error) {
            console.error('Failed to auto-start fast:', error)
            toast.error('Failed to auto-start your scheduled fast')
          }

          break // Only start one fast at a time
        }
      }
    }
  }, [scheduledFasts, activeSession, startSession])

  // Check for fasts to start every minute
  useEffect(() => {
    // Initial check
    checkAndStartFasts()

    // Set up interval
    const interval = setInterval(() => {
      checkAndStartFasts()
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [checkAndStartFasts])

  // Refresh upcoming fasts periodically
  useEffect(() => {
    fetchUpcomingFasts()

    const interval = setInterval(() => {
      fetchUpcomingFasts()
    }, 5 * 60000) // Refresh every 5 minutes

    return () => clearInterval(interval)
  }, [fetchUpcomingFasts])

  return null // This is a headless component
}

// Hook to check for conflicts when scheduling new fasts
export function useScheduleConflicts() {
  const { scheduledFasts } = useScheduledFastsStore()
  const { activeSession } = useFastingSessionStore()

  const checkConflict = useCallback((startDate: Date, endDate: Date, excludeId?: string) => {
    // Check against active session
    if (activeSession) {
      const sessionEnd = activeSession.endTime 
        ? new Date(activeSession.endTime)
        : new Date(new Date(activeSession.startTime).getTime() + activeSession.targetHours * 60 * 60 * 1000)

      if (
        isWithinInterval(startDate, { start: new Date(activeSession.startTime), end: sessionEnd }) ||
        isWithinInterval(new Date(activeSession.startTime), { start: startDate, end: endDate })
      ) {
        return {
          hasConflict: true,
          conflictType: 'active' as const,
          conflictWith: activeSession,
        }
      }
    }

    // Check against scheduled fasts
    if (!scheduledFasts || !Array.isArray(scheduledFasts)) {
      return { hasConflict: false }
    }

    for (const fast of scheduledFasts) {
      if (excludeId && fast.id === excludeId) continue

      const fastStart = new Date(fast.scheduledStart)
      const fastEnd = new Date(fast.scheduledEnd)

      if (
        isWithinInterval(startDate, { start: fastStart, end: fastEnd }) ||
        isWithinInterval(fastStart, { start: startDate, end: endDate })
      ) {
        return {
          hasConflict: true,
          conflictType: 'scheduled' as const,
          conflictWith: fast,
        }
      }
    }

    return { hasConflict: false }
  }, [scheduledFasts, activeSession])

  return { checkConflict }
}