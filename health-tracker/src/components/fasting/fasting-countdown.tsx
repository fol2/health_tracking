"use client"

import { useEffect, useState } from "react"

interface FastingCountdownProps {
  startTime: Date | string
  targetHours: number
  className?: string
}

export function FastingCountdown({ startTime, targetHours, className }: FastingCountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState("")
  const [timeElapsed, setTimeElapsed] = useState("")
  const [progress, setProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startTime)
      const now = new Date()
      const elapsedMs = now.getTime() - start.getTime()
      const targetMs = targetHours * 60 * 60 * 1000
      const remainingMs = Math.max(0, targetMs - elapsedMs)
      
      // Calculate progress percentage
      const progressPercent = Math.min((elapsedMs / targetMs) * 100, 100)
      setProgress(progressPercent)
      setIsCompleted(remainingMs === 0)
      
      // Format time remaining
      const hours = Math.floor(remainingMs / (1000 * 60 * 60))
      const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
      
      // Format time elapsed
      const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60))
      const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (isCompleted) {
        setTimeRemaining("Complete")
      } else {
        setTimeRemaining(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
      
      setTimeElapsed(`${elapsedHours}h ${elapsedMinutes}m`)
    }

    calculateTime()
    const interval = setInterval(calculateTime, 1000)

    return () => clearInterval(interval)
  }, [startTime, targetHours, isCompleted])

  // Calculate stroke dasharray for ring
  const radius = 58
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (progress / 100) * circumference

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <svg className="transform -rotate-90 w-36 h-36">
          {/* Background ring */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted opacity-20"
          />
          {/* Progress ring */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className={`transition-all duration-1000 ${
              isCompleted ? 'text-green-600 opacity-80' : 'text-primary opacity-40'
            }`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-mono font-medium ${
            isCompleted ? 'text-green-600' : ''
          }`}>
            {timeRemaining}
          </span>
          <span className="text-xs text-muted-foreground mt-1">
            {isCompleted ? 'Complete' : `${targetHours}h fast`}
          </span>
        </div>
      </div>
    </div>
  )
}