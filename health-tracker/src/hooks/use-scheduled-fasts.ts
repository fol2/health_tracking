// useScheduledFasts hook - Manages scheduled and recurring fasts

import { useEffect, useCallback } from 'react'
import { useScheduledFastsStore, useOfflineStore } from '@/store'
import { useAuth } from './use-auth'

export function useScheduledFasts() {
  const { isAuthenticated } = useAuth()
  const { isOnline, addToQueue } = useOfflineStore()
  const {
    scheduledFasts,
    upcomingFasts,
    isLoading,
    error,
    createScheduledFast,
    updateScheduledFast,
    deleteScheduledFast,
    fetchScheduledFasts,
    fetchUpcomingFasts,
  } = useScheduledFastsStore()

  // Fetch scheduled fasts on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchScheduledFasts().catch(console.error)
      fetchUpcomingFasts().catch(console.error)
    }
  }, [isAuthenticated, fetchScheduledFasts, fetchUpcomingFasts])

  // Offline-aware create scheduled fast
  const createScheduledFastOffline = useCallback(
    async (data: any) => {
      if (!isOnline) {
        const tempId = `temp-${Date.now()}`
        const scheduledFast = {
          id: tempId,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        // Queue for later sync
        addToQueue({
          type: 'CREATE',
          resource: 'scheduled',
          data,
        })

        // Optimistically update UI
        useScheduledFastsStore.setState((state) => ({
          scheduledFasts: [scheduledFast, ...state.scheduledFasts],
        }))

        return
      }

      return createScheduledFast(data)
    },
    [isOnline, addToQueue, createScheduledFast]
  )

  // Offline-aware delete scheduled fast
  const deleteScheduledFastOffline = useCallback(
    async (id: string) => {
      if (!isOnline) {
        // Queue for later sync
        addToQueue({
          type: 'DELETE',
          resource: 'scheduled',
          data: { id },
        })

        // Optimistically update UI
        useScheduledFastsStore.setState((state) => ({
          scheduledFasts: state.scheduledFasts.filter(f => f.id !== id),
          upcomingFasts: state.upcomingFasts.filter(f => f.id !== id),
        }))

        return
      }

      return deleteScheduledFast(id)
    },
    [isOnline, addToQueue, deleteScheduledFast]
  )

  // Get next scheduled fast
  const nextScheduledFast = useCallback(() => {
    if (!upcomingFasts.length) return null
    
    return upcomingFasts.reduce((next, fast) => {
      const fastTime = new Date(fast.scheduledStart).getTime()
      const nextTime = new Date(next.scheduledStart).getTime()
      return fastTime < nextTime ? fast : next
    })
  }, [upcomingFasts])

  // Check if a fast is starting soon (within 1 hour)
  const isStartingSoon = useCallback((fast: any) => {
    const now = Date.now()
    const startTime = new Date(fast.scheduledStart).getTime()
    const oneHour = 60 * 60 * 1000
    
    return startTime - now <= oneHour && startTime > now
  }, [])

  return {
    // Data
    scheduledFasts,
    upcomingFasts,
    nextScheduledFast: nextScheduledFast(),
    
    // State
    isLoading,
    error,
    
    // Actions
    createScheduledFast: createScheduledFastOffline,
    updateScheduledFast,
    deleteScheduledFast: deleteScheduledFastOffline,
    
    // Helpers
    isStartingSoon,
    
    // Refetch functions
    refetchScheduledFasts: fetchScheduledFasts,
    refetchUpcomingFasts: fetchUpcomingFasts,
  }
}