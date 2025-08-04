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

  // Get scheduled fasts for a specific day
  const getScheduledFastsForDay = (date: Date) => {
    if (!scheduledFasts || !Array.isArray(scheduledFasts)) {
      return []
    }
    return scheduledFasts.filter(fast => {
      const fastStart = new Date(fast.scheduledStart)
      return isSameDay(fastStart, date)
    })
  }

  // Get completed fasts for a specific day
  const getCompletedFastsForDay = (date: Date) => {
    if (!recentSessions || !Array.isArray(recentSessions)) {
      return []
    }
    return recentSessions.filter(session => {
      const sessionStart = new Date(session.startTime)
      return isSameDay(sessionStart, date) && session.status === 'completed'
    })
  }

  // Get active fast for a specific day
  const getActiveFastForDay = (date: Date) => {
    if (!recentSessions || !Array.isArray(recentSessions)) {
      return undefined
    }
    return recentSessions.find(session => {
      const sessionStart = new Date(session.startTime)
      return isSameDay(sessionStart, date) && session.status === 'active'
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
                
                {/* Event indicators */}
                {hasEvents && (
                  <div className="flex gap-0.5 mt-1">
                    {active && (
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    )}
                    {completed.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                    )}
                    {scheduled.length > 0 && (
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                    )}
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
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