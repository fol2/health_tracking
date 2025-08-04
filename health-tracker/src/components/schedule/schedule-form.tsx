'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { format } from 'date-fns'
import { Calendar as CalendarIcon, Clock, Bell, Repeat } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useScheduledFastsStore } from '@/store/scheduled-fasts-store'
import { toast } from 'sonner'
import { MiniCalendar } from './calendar'
import { useScheduleConflicts } from './auto-start-monitor'
import type { FastingType, RecurrencePattern } from '@/types/database'

const fastingTypes = [
  { value: '16:8', label: '16:8 (16 hours)', hours: 16 },
  { value: '18:6', label: '18:6 (18 hours)', hours: 18 },
  { value: '20:4', label: '20:4 (20 hours)', hours: 20 },
  { value: '24h', label: '24 hours', hours: 24 },
  { value: '36h', label: '36 hours', hours: 36 },
  { value: '48h', label: '48 hours', hours: 48 },
  { value: 'custom', label: 'Custom', hours: 0 },
]

const scheduleFormSchema = z.object({
  type: z.string().min(1, 'Please select a fasting type'),
  customHours: z.number().min(1).max(168).optional(),
  startDate: z.date(),
  startTime: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format'),
  isRecurring: z.boolean(),
  recurrenceFrequency: z.enum(['daily', 'weekly', 'monthly']).optional(),
  recurrenceInterval: z.number().min(1).max(30).optional(),
  recurrenceDaysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  recurrenceEndDate: z.date().optional(),
  reminderEnabled: z.boolean(),
  reminderMinutes: z.number().min(5).max(1440),
  notes: z.string().optional(),
})

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

interface ScheduleFormProps {
  onSuccess?: () => void
  initialDate?: Date
}

export function ScheduleForm({ onSuccess, initialDate }: ScheduleFormProps) {
  const { createScheduledFast, isLoading } = useScheduledFastsStore()
  const { checkConflict } = useScheduleConflicts()
  const [showDatePicker, setShowDatePicker] = useState(false)

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      type: '16:8',
      startDate: initialDate || new Date(),
      startTime: '09:00',
      customHours: 16,
      isRecurring: false,
      recurrenceFrequency: 'daily',
      recurrenceInterval: 1,
      recurrenceDaysOfWeek: [],
      recurrenceEndDate: undefined,
      reminderEnabled: true,
      reminderMinutes: 30,
      notes: '',
    },
  })

  const selectedType = form.watch('type')
  const isRecurring = form.watch('isRecurring')
  const recurrenceFrequency = form.watch('recurrenceFrequency')

  const onSubmit = async (data: ScheduleFormValues) => {
    try {
      // Calculate end time based on fasting type
      let hours = 16
      if (data.type === 'custom' && data.customHours) {
        hours = data.customHours
      } else {
        const typeConfig = fastingTypes.find(t => t.value === data.type)
        if (typeConfig) {
          hours = typeConfig.hours
        }
      }

      // Combine date and time
      const [hourStr, minuteStr] = data.startTime.split(':')
      const scheduledStart = new Date(data.startDate)
      scheduledStart.setHours(parseInt(hourStr), parseInt(minuteStr), 0, 0)

      // Calculate end time
      const scheduledEnd = new Date(scheduledStart)
      scheduledEnd.setHours(scheduledEnd.getHours() + hours)

      // Check for conflicts
      const conflict = checkConflict(scheduledStart, scheduledEnd)
      if (conflict.hasConflict) {
        const conflictMessage = conflict.conflictType === 'active'
          ? 'This time conflicts with your active fasting session'
          : `This time conflicts with another scheduled fast${conflict.conflictWith ? ` (${conflict.conflictWith.type})` : ''}`
        
        toast.error(conflictMessage)
        return
      }

      // Build recurrence pattern if applicable
      let recurrencePattern: RecurrencePattern | undefined
      if (data.isRecurring && data.recurrenceFrequency) {
        recurrencePattern = {
          frequency: data.recurrenceFrequency,
          interval: data.recurrenceInterval || 1,
          daysOfWeek: data.recurrenceDaysOfWeek,
          endDate: data.recurrenceEndDate?.toISOString(),
        }
      }

      await createScheduledFast({
        type: data.type as FastingType,
        scheduledStart,
        scheduledEnd,
        isRecurring: data.isRecurring,
        recurrencePattern,
        reminderTime: data.reminderEnabled ? data.reminderMinutes : undefined,
        notes: data.notes,
      })

      toast.success('Fasting session scheduled successfully')
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Failed to schedule fasting session:', error)
      toast.error('Failed to schedule fasting session')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Fasting Session</CardTitle>
        <CardDescription>
          Plan your fasting sessions in advance and set reminders
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Fasting Type */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fasting Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fasting type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fastingTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Custom Hours */}
            {selectedType === 'custom' && (
              <FormField
                control={form.control}
                name="customHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Custom Duration (hours)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter hours"
                        {...field}
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Start Date */}
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      onClick={() => setShowDatePicker(!showDatePicker)}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                    </Button>
                    {showDatePicker && (
                      <div className="absolute top-full mt-2 z-50">
                        <MiniCalendar
                          value={field.value}
                          onSelect={(date) => {
                            field.onChange(date)
                            setShowDatePicker(false)
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Time */}
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Recurring Options */}
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      <Repeat className="inline-block mr-2 h-4 w-4" />
                      Recurring Fast
                    </FormLabel>
                    <FormDescription>
                      Repeat this fast on a regular schedule
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Recurrence Pattern */}
            {isRecurring && (
              <div className="space-y-4 pl-6 border-l-2 border-muted">
                <FormField
                  control={form.control}
                  name="recurrenceFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Repeat Every</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="daily">Day</SelectItem>
                          <SelectItem value="weekly">Week</SelectItem>
                          <SelectItem value="monthly">Month</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {recurrenceFrequency === 'weekly' && (
                  <FormField
                    control={form.control}
                    name="recurrenceDaysOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>On Days</FormLabel>
                        <div className="grid grid-cols-7 gap-2">
                          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                            <label
                              key={day}
                              className="flex flex-col items-center p-2 border rounded cursor-pointer hover:bg-muted"
                            >
                              <input
                                type="checkbox"
                                className="mb-1"
                                checked={field.value?.includes(index)}
                                onChange={(e) => {
                                  const newValue = e.target.checked
                                    ? [...(field.value || []), index]
                                    : field.value?.filter(d => d !== index) || []
                                  field.onChange(newValue)
                                }}
                              />
                              <span className="text-xs">{day}</span>
                            </label>
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="recurrenceEndDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? format(field.value, 'yyyy-MM-dd') : ''}
                          onChange={e => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        Leave empty for no end date
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Reminder Settings */}
            <FormField
              control={form.control}
              name="reminderEnabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      <Bell className="inline-block mr-2 h-4 w-4" />
                      Reminder
                    </FormLabel>
                    <FormDescription>
                      Get notified before your fast starts
                    </FormDescription>
                  </div>
                  <FormControl>
                    <input
                      type="checkbox"
                      className="h-4 w-4"
                      checked={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch('reminderEnabled') && (
              <FormField
                control={form.control}
                name="reminderMinutes"
                render={({ field }) => (
                  <FormItem className="pl-6">
                    <FormLabel>Remind me</FormLabel>
                    <Select
                      onValueChange={value => field.onChange(parseInt(value))}
                      value={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="5">5 minutes before</SelectItem>
                        <SelectItem value="15">15 minutes before</SelectItem>
                        <SelectItem value="30">30 minutes before</SelectItem>
                        <SelectItem value="60">1 hour before</SelectItem>
                        <SelectItem value="120">2 hours before</SelectItem>
                        <SelectItem value="1440">1 day before</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any notes about this fast..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Scheduling...' : 'Schedule Fast'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}