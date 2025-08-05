'use client'

import { useMemo } from 'react'

interface CalendarPieIndicatorProps {
  fastingHours: number // hours of fasting in this day (0-24)
  color: string // color of the pie
  size?: number // size in pixels
}

export function CalendarPieIndicator({ fastingHours, color, size = 20 }: CalendarPieIndicatorProps) {
  const svgPath = useMemo(() => {
    // Ensure fasting hours is between 0 and 24
    const hours = Math.min(Math.max(fastingHours, 0), 24)
    const percentage = hours / 24
    
    // No fasting
    if (percentage === 0) {
      return null
    }
    
    // Full day fasting
    if (percentage >= 1) {
      return `M ${size/2} ${size/2} m -${size/2} 0 a ${size/2} ${size/2} 0 1 0 ${size} 0 a ${size/2} ${size/2} 0 1 0 -${size} 0`
    }
    
    // Calculate the angle (starting from top, going clockwise)
    const angle = percentage * 2 * Math.PI
    const largeArcFlag = percentage > 0.5 ? 1 : 0
    
    // Calculate end point
    const endX = size/2 + (size/2) * Math.sin(angle)
    const endY = size/2 - (size/2) * Math.cos(angle)
    
    // Create the path
    return `M ${size/2} ${size/2} L ${size/2} 0 A ${size/2} ${size/2} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
  }, [fastingHours, size])

  if (!svgPath) {
    // No fasting - show hollow circle
    return (
      <svg width={size} height={size} className="inline-block">
        <circle
          cx={size/2}
          cy={size/2}
          r={size/2 - 1}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
      </svg>
    )
  }

  return (
    <svg width={size} height={size} className="inline-block">
      {/* Background hollow circle */}
      <circle
        cx={size/2}
        cy={size/2}
        r={size/2 - 1}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        opacity="0.3"
      />
      {/* Filled pie segment */}
      <path
        d={svgPath}
        fill={color}
        opacity="0.8"
      />
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