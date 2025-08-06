'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useFastingSessionStore } from '@/store'
import { useRealtimeTimer } from '@/hooks'
import { Play, Pause, StopCircle, Clock, Target, Edit } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EditStartTimeDialog } from './edit-start-time-dialog'

export function FastingTimer() {
  const { 
    activeSession, 
    timerState, 
    pauseTimer, 
    resumeTimer, 
    endSession,
    cancelSession 
  } = useFastingSessionStore()
  
  const {
    elapsed,
    remaining,
    progress,
    isRunning,
    elapsedHours,
    remainingHours,
  } = useRealtimeTimer()

  const [showEndDialog, setShowEndDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [isEnding, setIsEnding] = useState(false)

  const handleEndFast = async () => {
    setIsEnding(true)
    try {
      await endSession()
      setShowEndDialog(false)
    } catch (error) {
      console.error('Failed to end fast:', error)
    } finally {
      setIsEnding(false)
    }
  }

  if (!activeSession || !timerState) {
    return null
  }

  // Calculate circular progress
  const circumference = 2 * Math.PI * 120 // radius = 120
  const strokeDashoffset = circumference * (1 - progress)

  return (
    <>
      <Card className="p-6 bg-card/50 backdrop-blur">
        <div className="flex flex-col items-center space-y-6">
          {/* Circular Progress */}
          <div className="relative w-64 h-64">
            <svg
              className="w-full h-full transform -rotate-90"
              viewBox="0 0 256 256"
            >
              {/* Background circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-muted"
              />
              {/* Progress circle */}
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="text-primary transition-all duration-1000 ease-linear"
                strokeLinecap="round"
              />
            </svg>
            
            {/* Timer Display */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-4xl font-mono font-bold text-foreground">
                {elapsed}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                Elapsed Time
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-2xl font-mono text-foreground/80">
                  {remaining}
                </div>
                <div className="text-xs text-muted-foreground">
                  Remaining
                </div>
              </div>
            </div>
          </div>

          {/* Fasting Type and Progress */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">{activeSession.type} Fast</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{elapsedHours} hours elapsed</span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span>{activeSession.targetHours}h target</span>
              </div>
            </div>
            <div className="text-lg font-medium">
              {Math.round(progress * 100)}% Complete
            </div>
            {/* Edit Start Time Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="mt-2"
            >
              <Edit className="mr-2 h-3 w-3" />
              Edit Start Time
            </Button>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 w-full max-w-xs">
            {isRunning ? (
              <Button
                variant="outline"
                size="lg"
                onClick={pauseTimer}
                className="flex-1"
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                onClick={resumeTimer}
                className="flex-1"
              >
                <Play className="mr-2 h-4 w-4" />
                Resume
              </Button>
            )}
            
            <Button
              variant="destructive"
              size="lg"
              onClick={() => setShowEndDialog(true)}
              className="flex-1"
            >
              <StopCircle className="mr-2 h-4 w-4" />
              End Fast
            </Button>
          </div>

          {/* Notes */}
          {activeSession.notes && (
            <div className="w-full p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Notes:</p>
              <p className="text-sm mt-1">{activeSession.notes}</p>
            </div>
          )}
        </div>
      </Card>

      {/* End Fast Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Fasting Session?</DialogTitle>
            <DialogDescription>
              You've been fasting for {elapsedHours} hours. 
              {progress < 1 
                ? ` You're ${Math.round(progress * 100)}% of the way to your ${activeSession.targetHours} hour goal.`
                : ' Congratulations on completing your fasting goal!'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEndDialog(false)}
              disabled={isEnding}
            >
              Continue Fasting
            </Button>
            <Button
              variant="default"
              onClick={handleEndFast}
              disabled={isEnding}
            >
              {isEnding ? 'Ending...' : 'End Fast'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Start Time Dialog */}
      <EditStartTimeDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        currentStartTime={new Date(activeSession.startTime)}
      />
    </>
  )
}