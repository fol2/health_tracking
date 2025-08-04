'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon, List, Plus, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Calendar } from '@/components/schedule/calendar'
import { ScheduleForm } from '@/components/schedule/schedule-form'
import { ScheduledList } from '@/components/schedule/scheduled-list'
import { ReminderSettings } from '@/components/schedule/reminder-settings'
import { ProtectedRoute } from '@/components/auth/protected-route'
import type { ScheduledFast } from '@/types/database'

export default function SchedulePage() {
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showReminderSettings, setShowReminderSettings] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [editingFast, setEditingFast] = useState<ScheduledFast | null>(null)

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    setShowScheduleForm(true)
  }

  const handleEditFast = (fast: ScheduledFast) => {
    setEditingFast(fast)
    setShowScheduleForm(true)
  }

  const handleScheduleSuccess = () => {
    setShowScheduleForm(false)
    setSelectedDate(undefined)
    setEditingFast(null)
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container max-w-7xl mx-auto py-6 px-4 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Fasting Schedule</h1>
            <p className="text-muted-foreground mt-1">
              Plan and manage your fasting sessions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowReminderSettings(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Reminders
            </Button>
            <Button
              size="sm"
              onClick={() => setShowScheduleForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Fast
            </Button>
          </div>
        </div>

        {/* View Toggle */}
        <Tabs value={view} onValueChange={(v: any) => setView(v)} className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar View */}
              <div className="lg:col-span-2">
                <Calendar
                  onDateClick={handleDateClick}
                  selectedDate={selectedDate}
                />
              </div>

              {/* Upcoming Fasts Sidebar */}
              <div className="lg:col-span-1">
                <ScheduledList
                  onEdit={handleEditFast}
                  className="h-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="list" className="mt-6">
            <ScheduledList onEdit={handleEditFast} />
          </TabsContent>
        </Tabs>

        {/* Schedule Form Dialog */}
        <Dialog open={showScheduleForm} onOpenChange={setShowScheduleForm}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingFast ? 'Edit Scheduled Fast' : 'Schedule New Fast'}
              </DialogTitle>
              <DialogDescription>
                {editingFast ? 'Modify your scheduled fasting session' : 'Plan a new fasting session with custom timing and reminders'}
              </DialogDescription>
            </DialogHeader>
            <ScheduleForm
              initialDate={selectedDate}
              onSuccess={handleScheduleSuccess}
            />
          </DialogContent>
        </Dialog>

        {/* Reminder Settings Dialog */}
        <Dialog open={showReminderSettings} onOpenChange={setShowReminderSettings}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Reminder Settings</DialogTitle>
              <DialogDescription>
                Configure when and how you want to be reminded about your scheduled fasts
              </DialogDescription>
            </DialogHeader>
            <ReminderSettings />
          </DialogContent>
        </Dialog>
      </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}