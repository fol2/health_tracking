'use client'

import { useMemo } from 'react'

interface CalendarPieIndicatorProps {
  fastingHours: number
  color: string
  size?: number
}

const FILL_OPACITY = 0.8
const STROKE_OPACITY = 0.3

export function CalendarPieIndicator({ fastingHours, color, size = 20 }: CalendarPieIndicatorProps) {
  const { percentage, piePath } = useMemo(() => {
    const hours = Math.min(Math.max(fastingHours, 0), 24)
    const pct = hours / 24
    
    if (pct === 0 || pct >= 1) {
      return { percentage: pct, piePath: '' }
    }
    
    // Calculate partial pie path
    const angle = pct * 2 * Math.PI
    const largeArcFlag = pct > 0.5 ? 1 : 0
    const endX = size / 2 + (size / 2) * Math.sin(angle)
    const endY = size / 2 - (size / 2) * Math.cos(angle)
    
    return {
      percentage: pct,
      piePath: `M ${size / 2} ${size / 2} L ${size / 2} 0 A ${size / 2} ${size / 2} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    }
  }, [fastingHours, size])

  const centerPoint = size / 2
  const isPartial = percentage > 0 && percentage < 1

  return (
    <svg width={size} height={size} className="inline-block">
      {/* Base circle - shown for empty and partial states */}
      {percentage < 1 && (
        <circle
          cx={centerPoint}
          cy={centerPoint}
          r={centerPoint - 1}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity={STROKE_OPACITY}
        />
      )}
      
      {/* Full circle for complete fast */}
      {percentage >= 1 && (
        <circle
          cx={centerPoint}
          cy={centerPoint}
          r={centerPoint}
          fill={color}
          opacity={FILL_OPACITY}
        />
      )}
      
      {/* Partial pie slice */}
      {isPartial && (
        <path d={piePath} fill={color} opacity={FILL_OPACITY} />
      )}
    </svg>
  )
}

// Helper function to calculate fasting hours for a specific day
export function calculateFastingHoursForDay(
  day: Date,
  fastStart: Date,
  fastEnd: Date
): number {
  const dayStart = new Date(day)
  dayStart.setHours(0, 0, 0, 0)
  
  const dayEnd = new Date(day)
  dayEnd.setHours(23, 59, 59, 999)
  
  // If fast doesn't overlap with this day, return 0
  if (fastEnd < dayStart || fastStart > dayEnd) {
    return 0
  }
  
  // Calculate the actual fasting period within this day
  const actualStart = fastStart > dayStart ? fastStart : dayStart
  const actualEnd = fastEnd < dayEnd ? fastEnd : dayEnd
  
  // Calculate hours
  const milliseconds = actualEnd.getTime() - actualStart.getTime()
  const hours = milliseconds / (1000 * 60 * 60)
  
  return hours
}