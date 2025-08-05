'use client'

import { useMemo } from 'react'

interface CalendarPieIndicatorProps {
  fastingHours: number
  color: string
  size?: number
}

type IndicatorType = 'empty' | 'full' | 'partial'

interface SvgCircleProps {
  size: number
  fill?: string
  stroke?: string
  opacity?: number
}

// Reusable circle component
function SvgCircle({ size, fill = 'none', stroke = 'currentColor', opacity = 0.3 }: SvgCircleProps) {
  const radius = fill === 'none' ? size / 2 - 1 : size / 2
  return (
    <circle
      cx={size / 2}
      cy={size / 2}
      r={radius}
      fill={fill}
      stroke={stroke}
      strokeWidth="1"
      opacity={opacity}
    />
  )
}

export function CalendarPieIndicator({ fastingHours, color, size = 20 }: CalendarPieIndicatorProps) {
  const { type, path } = useMemo(() => {
    const hours = Math.min(Math.max(fastingHours, 0), 24)
    const percentage = hours / 24
    
    if (percentage === 0) return { type: 'empty' as IndicatorType, path: null }
    if (percentage >= 1) return { type: 'full' as IndicatorType, path: null }
    
    // Calculate partial pie path
    const angle = percentage * 2 * Math.PI
    const largeArcFlag = percentage > 0.5 ? 1 : 0
    const endX = size / 2 + (size / 2) * Math.sin(angle)
    const endY = size / 2 - (size / 2) * Math.cos(angle)
    
    return {
      type: 'partial' as IndicatorType,
      path: `M ${size / 2} ${size / 2} L ${size / 2} 0 A ${size / 2} ${size / 2} 0 ${largeArcFlag} 1 ${endX} ${endY} Z`
    }
  }, [fastingHours, size])

  return (
    <svg width={size} height={size} className="inline-block">
      {type === 'empty' && <SvgCircle size={size} />}
      {type === 'full' && <SvgCircle size={size} fill={color} opacity={0.8} />}
      {type === 'partial' && (
        <>
          <SvgCircle size={size} />
          <path d={path!} fill={color} opacity="0.8" />
        </>
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