// useRealtimeTimer hook - Updates timer display every second

import { useEffect, useState } from 'react'
import { useFastingSessionStore } from '@/store'

export function useRealtimeTimer() {
  const { timerState } = useFastingSessionStore()
  const [, forceUpdate] = useState({})

  useEffect(() => {
    if (!timerState?.isRunning || timerState?.isPaused) return

    const interval = setInterval(() => {
      forceUpdate({})
    }, 1000)

    return () => clearInterval(interval)
  }, [timerState?.isRunning, timerState?.isPaused])

  if (!timerState) {
    return {
      elapsed: '00:00:00',
      remaining: '00:00:00',
      progress: 0,
      isRunning: false,
    }
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    return [hours, minutes, secs]
      .map(val => val.toString().padStart(2, '0'))
      .join(':')
  }

  const totalSeconds = Math.floor(
    (timerState.targetEndTime.getTime() - timerState.startTime.getTime()) / 1000
  )
  const progress = timerState.elapsedSeconds / totalSeconds

  return {
    elapsed: formatTime(timerState.elapsedSeconds),
    remaining: formatTime(timerState.remainingSeconds),
    progress: Math.min(progress, 1),
    isRunning: timerState.isRunning && !timerState.isPaused,
    elapsedHours: (timerState.elapsedSeconds / 3600).toFixed(1),
    remainingHours: (timerState.remainingSeconds / 3600).toFixed(1),
  }
}