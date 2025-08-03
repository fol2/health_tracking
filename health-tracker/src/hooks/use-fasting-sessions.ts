// useFastingSessions hook - Manages fasting session data and timer

import { useEffect, useCallback } from 'react'
import { useFastingSessionStore, useOfflineStore } from '@/store'
import { useAuth } from './use-auth'

export function useFastingSessions() {
  const { isAuthenticated } = useAuth()
  const { isOnline, addToQueue } = useOfflineStore()
  const {
    activeSession,
    recentSessions,
    stats,
    timerState,
    isLoading,
    error,
    startSession,
    endSession,
    cancelSession,
    fetchActiveSession,
    fetchRecentSessions,
    fetchStats,
    pauseTimer,
    resumeTimer,
  } = useFastingSessionStore()

  // Fetch active session and recent sessions on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchActiveSession().catch(console.error)
      fetchRecentSessions().catch(console.error)
      fetchStats().catch(console.error)
    }
  }, [isAuthenticated, fetchActiveSession, fetchRecentSessions, fetchStats])

  // Offline-aware start session
  const startSessionOffline = useCallback(
    async (data: { type: string; targetHours: number; notes?: string }) => {
      if (!isOnline) {
        // Queue for later sync
        addToQueue({
          type: 'CREATE',
          resource: 'session',
          data: {
            ...data,
            startTime: new Date(),
          },
        })
        
        // Optimistically update UI
        useFastingSessionStore.setState((state) => ({
          activeSession: {
            id: `temp-${Date.now()}`,
            userId: '',
            startTime: new Date(),
            targetHours: data.targetHours,
            type: data.type as any,
            notes: data.notes,
            status: 'active',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          timerState: {
            startTime: new Date(),
            targetEndTime: new Date(Date.now() + data.targetHours * 60 * 60 * 1000),
            elapsedSeconds: 0,
            remainingSeconds: data.targetHours * 60 * 60,
            isRunning: true,
            isPaused: false,
          },
        }))
        
        resumeTimer()
        return
      }

      return startSession(data)
    },
    [isOnline, addToQueue, startSession, resumeTimer]
  )

  // Offline-aware end session
  const endSessionOffline = useCallback(async () => {
    if (!isOnline && activeSession) {
      // Queue for later sync
      addToQueue({
        type: 'UPDATE',
        resource: 'session',
        data: {
          id: activeSession.id,
          endTime: new Date(),
          status: 'completed',
        },
      })
      
      // Optimistically update UI
      useFastingSessionStore.setState((state) => ({
        activeSession: null,
        timerState: null,
      }))
      
      return
    }

    return endSession()
  }, [isOnline, activeSession, addToQueue, endSession])

  return {
    // Session data
    activeSession,
    recentSessions,
    stats,
    isLoading,
    error,
    
    // Timer state
    timerState,
    isTimerRunning: timerState?.isRunning && !timerState?.isPaused,
    
    // Actions
    startSession: startSessionOffline,
    endSession: endSessionOffline,
    cancelSession,
    pauseTimer,
    resumeTimer,
    
    // Refetch functions
    refetchActiveSession: fetchActiveSession,
    refetchSessions: fetchRecentSessions,
    refetchStats: fetchStats,
  }
}