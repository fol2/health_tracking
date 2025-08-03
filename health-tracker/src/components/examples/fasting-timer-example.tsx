// Example: Fasting Timer Component using the stores and hooks

'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useFastingSessions, useRealtimeTimer } from '@/hooks'
import { Play, Pause, StopCircle } from 'lucide-react'

export function FastingTimerExample() {
  const {
    activeSession,
    isLoading,
    startSession,
    endSession,
    pauseTimer,
    resumeTimer,
  } = useFastingSessions()

  const {
    elapsed,
    remaining,
    progress,
    isRunning,
    elapsedHours,
    remainingHours,
  } = useRealtimeTimer()

  const handleStart = async () => {
    await startSession({
      type: '16:8',
      targetHours: 16,
      notes: 'Daily intermittent fast',
    })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (!activeSession) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Start Fasting</h3>
        <Button onClick={handleStart} className="w-full">
          <Play className="mr-2 h-4 w-4" />
          Start 16:8 Fast
        </Button>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Active Fast</h3>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-secondary rounded-full h-2.5">
          <div
            className="bg-primary h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-3xl font-mono font-bold">{elapsed}</div>
        <div className="text-sm text-muted-foreground">
          {elapsedHours} hours elapsed
        </div>
      </div>

      <div className="text-center mb-6">
        <div className="text-xl font-mono">{remaining}</div>
        <div className="text-sm text-muted-foreground">
          {remainingHours} hours remaining
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        {isRunning ? (
          <Button
            variant="outline"
            size="sm"
            onClick={pauseTimer}
            className="flex-1"
          >
            <Pause className="mr-2 h-4 w-4" />
            Pause
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={resumeTimer}
            className="flex-1"
          >
            <Play className="mr-2 h-4 w-4" />
            Resume
          </Button>
        )}
        
        <Button
          variant="destructive"
          size="sm"
          onClick={endSession}
          className="flex-1"
        >
          <StopCircle className="mr-2 h-4 w-4" />
          End Fast
        </Button>
      </div>
    </Card>
  )
}