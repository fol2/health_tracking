'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useScheduledFastsStore } from '@/store/scheduled-fasts-store'
import { useFastingSessionStore } from '@/store/fasting-session-store'
import type { ScheduledFast, FastingSession } from '@/types/database'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday, isPast, isFuture, startOfDay, endOfDay } from 'date-fns'

interface CalendarProps {
  onDateClick?: (date: Date) => void
  selectedDate?: Date
  className?: string
}

export function Calendar({ onDateClick, selectedDate, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const { scheduledFasts } = useScheduledFastsStore()
  const { recentSessions } = useFastingSessionStore()

  // Get days in current month
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  // Get the first day of the week for the month
  const firstDayOfWeek = useMemo(() => {
    const start = startOfMonth(currentMonth)
    return start.getDay()
  }, [currentMonth])

  // Create empty cells for days before month starts
  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  // Check if a date falls within a fasting period
  const isDateWithinFastPeriod = (date: Date, startDate: Date, endDate: Date) => {
    const dayStart = startOfDay(date)
    const dayEnd = endOfDay(date)
    return startDate <= dayEnd && endDate >= dayStart
  }

  // Get scheduled fasts for a specific day (including multi-day fasts)
  const getScheduledFastsForDay = (date: Date) => {
    if (!scheduledFasts?.length) return []
    
    return scheduledFasts.filter(fast => {
      const fastStart = new Date(fast.scheduledStart)
      const fastEnd = new Date(fast.scheduledEnd)
      return isDateWithinFastPeriod(date, fastStart, fastEnd)
    })
  }

  // Get completed fasts for a specific day (including multi-day fasts)
  const getCompletedFastsForDay = (date: Date) => {
    if (!recentSessions?.length) return []
    
    return recentSessions.filter(session => {
      if (session.status !== 'completed') return false
      
      const sessionStart = new Date(session.startTime)
      const sessionEnd = session.endTime ? new Date(session.endTime) : new Date()
      return isDateWithinFastPeriod(date, sessionStart, sessionEnd)
    })
  }

  // Get active fast for a specific day (including multi-day fasts)
  const getActiveFastForDay = (date: Date) => {
    if (!recentSessions?.length) return undefined
    
    return recentSessions.find(session => {
      if (session.status !== 'active') return false
      
      const sessionStart = new Date(session.startTime)
      // For active sessions, use current time as end time
      const sessionEnd = new Date()
      return isDateWithinFastPeriod(date, sessionStart, sessionEnd)
    })
  }

  // Navigate months
  const goToPreviousMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  return (
    <Card className={cn("p-4", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToToday}
            className="hidden sm:flex"
          >
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground p-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells */}
        {emptyDays.map(day => (
          <div key={`empty-${day}`} className="aspect-square" />
        ))}

        {/* Days */}
        {days.map(day => {
          const scheduled = getScheduledFastsForDay(day)
          const completed = getCompletedFastsForDay(day)
          const active = getActiveFastForDay(day)
          const hasEvents = scheduled.length > 0 || completed.length > 0 || active

          // Determine if this is start/middle/end of any fast
          const isStartDay = (fast: any, sessionType: 'scheduled' | 'session') => {
            const startTime = sessionType === 'scheduled' ? fast.scheduledStart : fast.startTime
            return isSameDay(new Date(startTime), day)
          }

          const isEndDay = (fast: any, sessionType: 'scheduled' | 'session') => {
            const endTime = sessionType === 'scheduled' 
              ? fast.scheduledEnd 
              : (fast.endTime || new Date())
            return isSameDay(new Date(endTime), day)
          }

          return (
            <button
              key={day.toISOString()}
              onClick={() => onDateClick?.(day)}
              className={cn(
                "aspect-square p-1 relative rounded-md transition-colors",
                "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary",
                !isSameMonth(day, currentMonth) && "text-muted-foreground opacity-50",
                isToday(day) && "ring-2 ring-primary",
                selectedDate && isSameDay(day, selectedDate) && "bg-primary text-primary-foreground",
                hasEvents && !selectedDate && "bg-muted"
              )}
            >
              <div className="flex flex-col items-center justify-center h-full">
                <span className="text-sm">{format(day, 'd')}</span>
                
                {/* Event indicators with different shapes for start/middle/end */}
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1">
                    {active && (
                      <div className={cn(
                        "w-1.5 h-1.5 bg-green-500",
                        isStartDay(active, 'session') && "rounded-l-full",
                        isEndDay(active, 'session') && "rounded-r-full",
                        !isStartDay(active, 'session') && !isEndDay(active, 'session') && "rounded-none"
                      )} />
                    )}
                    {completed.length > 0 && (
                      <div className={cn(
                        "w-1.5 h-1.5 bg-blue-500",
                        completed.some(c => isStartDay(c, 'session')) && "rounded-l-full",
                        completed.some(c => isEndDay(c, 'session')) && "rounded-r-full",
                        !completed.some(c => isStartDay(c, 'session')) && !completed.some(c => isEndDay(c, 'session')) && "rounded-none"
                      )} />
                    )}
                    {scheduled.length > 0 && (
                      <div className={cn(
                        "w-1.5 h-1.5 bg-orange-500",
                        scheduled.some(s => isStartDay(s, 'scheduled')) && "rounded-l-full",
                        scheduled.some(s => isEndDay(s, 'scheduled')) && "rounded-r-full",
                        !scheduled.some(s => isStartDay(s, 'scheduled')) && !scheduled.some(s => isEndDay(s, 'scheduled')) && "rounded-none"
                      )} />
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 space-y-2">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-muted-foreground">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-muted-foreground">Scheduled</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Multi-day fasts show indicators on all covered days
        </div>
      </div>
    </Card>
  )
}

// Mini Calendar for date picker
interface MiniCalendarProps {
  value?: Date
  onSelect: (date: Date) => void
  className?: string
}

export function MiniCalendar({ value, onSelect, className }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(value || new Date())

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth)
    const end = endOfMonth(currentMonth)
    return eachDayOfInterval({ start, end })
  }, [currentMonth])

  const firstDayOfWeek = useMemo(() => {
    const start = startOfMonth(currentMonth)
    return start.getDay()
  }, [currentMonth])

  const emptyDays = Array.from({ length: firstDayOfWeek }, (_, i) => i)

  return (
    <div className={cn("p-3 bg-background rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
        <span className="text-sm font-medium">
          {format(currentMonth, 'MMM yyyy')}
        </span>
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          className="p-1 hover:bg-muted rounded"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>

      {/* Days of Week */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-xs text-muted-foreground">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {emptyDays.map(day => (
          <div key={`empty-${day}`} className="w-6 h-6" />
        ))}
        {days.map(day => (
          <button
            key={day.toISOString()}
            onClick={() => onSelect(day)}
            className={cn(
              "w-6 h-6 text-xs rounded hover:bg-muted",
              !isSameMonth(day, currentMonth) && "opacity-50",
              isToday(day) && "font-bold",
              value && isSameDay(day, value) && "bg-primary text-primary-foreground"
            )}
          >
            {format(day, 'd')}
          </button>
        ))}
      </div>
    </div>
  )
}