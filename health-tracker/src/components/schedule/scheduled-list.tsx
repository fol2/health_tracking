'use client'

import { useState, useEffect } from 'react'
import { format, formatDistanceToNow, isPast, isFuture, isToday } from 'date-fns'
import { Calendar, Clock, Edit2, Trash2, Play, Filter, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useScheduledFastsStore } from '@/store/scheduled-fasts-store'
import { useFastingSessionStore } from '@/store/fasting-session-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { ScheduledFast, RecurrencePattern } from '@/types/database'

interface ScheduledListProps {
  onEdit?: (fast: ScheduledFast) => void
  className?: string
}

export function ScheduledList({ onEdit, className }: ScheduledListProps) {
  const { scheduledFasts, fetchScheduledFasts, deleteScheduledFast, isLoading } = useScheduledFastsStore()
  const { startSession } = useFastingSessionStore()
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'recurring'>('upcoming')

  useEffect(() => {
    fetchScheduledFasts()
  }, [fetchScheduledFasts])

  const filteredFasts = (scheduledFasts || []).filter(fast => {
    const startDate = new Date(fast.scheduledStart)
    switch (filter) {
      case 'upcoming':
        return isFuture(startDate) || isToday(startDate)
      case 'past':
        return isPast(startDate) && !isToday(startDate)
      case 'recurring':
        return fast.isRecurring
      default:
        return true
    }
  }).sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())

  const handleStartNow = async (fast: ScheduledFast) => {
    try {
      const hours = Math.round(
        (new Date(fast.scheduledEnd).getTime() - new Date(fast.scheduledStart).getTime()) / (1000 * 60 * 60)
      )
      
      await startSession({
        type: fast.type,
        targetHours: hours,
        notes: fast.notes || undefined,
      })

      // Delete the scheduled fast if it's not recurring
      if (!fast.isRecurring) {
        await deleteScheduledFast(fast.id)
      }

      toast.success('Fasting session started')
    } catch (error) {
      toast.error('Failed to start fasting session')
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this scheduled fast?')) {
      try {
        await deleteScheduledFast(id)
        toast.success('Scheduled fast deleted')
      } catch (error) {
        console.error('Failed to delete scheduled fast:', error)
        toast.error('Failed to delete scheduled fast')
      }
    }
  }

  const getStatusBadge = (fast: ScheduledFast) => {
    const startDate = new Date(fast.scheduledStart)
    
    if (isToday(startDate)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-500">
          Today
        </span>
      )
    } else if (isFuture(startDate)) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-500">
          Upcoming
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted-foreground/10 text-muted-foreground">
          Past
        </span>
      )
    }
  }

  const formatDuration = (start: string, end: string) => {
    const hours = Math.round(
      (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60)
    )
    return `${hours} hours`
  }

  if (isLoading && (!scheduledFasts || scheduledFasts.length === 0)) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading scheduled fasts...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Scheduled Fasts</CardTitle>
        <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="upcoming">Upcoming</SelectItem>
            <SelectItem value="past">Past</SelectItem>
            <SelectItem value="recurring">Recurring</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        {filteredFasts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="mx-auto h-12 w-12 mb-3 opacity-50" />
            <p>No scheduled fasts found</p>
            <p className="text-sm mt-1">Create your first scheduled fast to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFasts.map((fast) => {
              const startDate = new Date(fast.scheduledStart)
              const canStartNow = isToday(startDate) || (isFuture(startDate) && 
                Math.abs(startDate.getTime() - Date.now()) < 60 * 60 * 1000) // Within 1 hour

              return (
                <div
                  key={fast.id}
                  className={cn(
                    "p-4 rounded-lg border bg-card transition-colors",
                    isPast(startDate) && !isToday(startDate) && "opacity-60"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{fast.type} Fast</h4>
                        {getStatusBadge(fast)}
                        {fast.isRecurring && (
                          <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{format(startDate, 'PPP')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{format(startDate, 'p')} ({formatDuration(fast.scheduledStart.toString(), fast.scheduledEnd.toString())})</span>
                        </div>
                      </div>

                      {fast.notes && (
                        <p className="text-sm text-muted-foreground">{fast.notes}</p>
                      )}

                      {fast.isRecurring && fast.recurrencePattern && (
                        <div className="text-xs text-muted-foreground">
                          Repeats {(fast.recurrencePattern as unknown as RecurrencePattern).frequency}
                          {(fast.recurrencePattern as unknown as RecurrencePattern).interval > 1 && ` every ${(fast.recurrencePattern as unknown as RecurrencePattern).interval} times`}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {canStartNow && (
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleStartNow(fast)}
                        >
                          <Play className="h-3.5 w-3.5 mr-1" />
                          Start
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit?.(fast)}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(fast.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}