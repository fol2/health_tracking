'use client'

import { useState, useEffect } from 'react'
import { Bell, BellOff, Clock, Calendar, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUserProfileStore } from '@/store/user-profile-store'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ReminderOption {
  label: string
  value: number
  description?: string
}

const reminderOptions: ReminderOption[] = [
  { label: '5 minutes', value: 5, description: 'Quick reminder' },
  { label: '15 minutes', value: 15, description: 'Short notice' },
  { label: '30 minutes', value: 30, description: 'Default' },
  { label: '1 hour', value: 60, description: 'Prepare in advance' },
  { label: '2 hours', value: 120, description: 'Early reminder' },
  { label: '1 day', value: 1440, description: 'Day before' },
]

export function ReminderSettings() {
  const { preferences, updatePreferences } = useUserProfileStore()
  const [defaultReminder, setDefaultReminder] = useState(30)
  const [notificationTypes, setNotificationTypes] = useState({
    fastStart: true,
    fastEnd: true,
    weightReminder: false,
    achievements: true,
  })
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (preferences?.notifications) {
      setNotificationTypes(preferences.notifications)
    }
  }, [preferences])

  const handleToggleNotification = async (type: keyof typeof notificationTypes) => {
    const newTypes = {
      ...notificationTypes,
      [type]: !notificationTypes[type],
    }
    setNotificationTypes(newTypes)

    try {
      setIsLoading(true)
      await updatePreferences({
        notifications: newTypes,
      })
      toast.success('Notification preferences updated')
    } catch (error) {
      toast.error('Failed to update preferences')
      // Revert the change
      setNotificationTypes(notificationTypes)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDefaultReminderChange = async (value: string) => {
    const minutes = parseInt(value)
    setDefaultReminder(minutes)
    
    // In a real app, you would save this to the user preferences
    toast.success(`Default reminder set to ${reminderOptions.find(o => o.value === minutes)?.label}`)
  }

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        toast.success('Notifications enabled!')
      } else if (permission === 'denied') {
        toast.error('Please enable notifications in your browser settings')
      }
    }
  }

  const notificationStatus = () => {
    if (!('Notification' in window)) {
      return 'not-supported'
    }
    return Notification.permission
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reminder Settings</CardTitle>
        <CardDescription>
          Configure when and how you want to be reminded about your fasts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Browser Notification Permission */}
        <div className="rounded-lg border p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Browser Notifications</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {notificationStatus() === 'granted' 
                  ? 'Notifications are enabled'
                  : notificationStatus() === 'denied'
                  ? 'Notifications are blocked. Please enable them in browser settings.'
                  : 'Enable browser notifications to receive reminders'}
              </p>
            </div>
            {notificationStatus() !== 'granted' && notificationStatus() !== 'denied' && (
              <Button
                variant="outline"
                onClick={requestNotificationPermission}
              >
                Enable
              </Button>
            )}
            {notificationStatus() === 'granted' && (
              <Check className="h-5 w-5 text-green-500" />
            )}
          </div>
        </div>

        {/* Default Reminder Time */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Default Reminder Time</label>
          <Select 
            value={defaultReminder.toString()} 
            onValueChange={handleDefaultReminderChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {reminderOptions.map(option => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  <div className="flex items-center justify-between w-full">
                    <span>{option.label}</span>
                    {option.description && (
                      <span className="text-xs text-muted-foreground ml-2">
                        {option.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            This will be the default reminder time for new scheduled fasts
          </p>
        </div>

        {/* Notification Types */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Notification Types</h3>
          <div className="space-y-2">
            <NotificationToggle
              icon={<Clock className="h-4 w-4" />}
              title="Fast Start Reminders"
              description="Get notified before your scheduled fasts begin"
              enabled={notificationTypes.fastStart}
              onToggle={() => handleToggleNotification('fastStart')}
              disabled={isLoading}
            />
            <NotificationToggle
              icon={<BellOff className="h-4 w-4" />}
              title="Fast End Reminders"
              description="Get notified when your fast is complete"
              enabled={notificationTypes.fastEnd}
              onToggle={() => handleToggleNotification('fastEnd')}
              disabled={isLoading}
            />
            <NotificationToggle
              icon={<Calendar className="h-4 w-4" />}
              title="Weight Check Reminders"
              description="Daily reminders to log your weight"
              enabled={notificationTypes.weightReminder}
              onToggle={() => handleToggleNotification('weightReminder')}
              disabled={isLoading}
            />
            <NotificationToggle
              icon={<Bell className="h-4 w-4" />}
              title="Achievement Notifications"
              description="Celebrate milestones and achievements"
              enabled={notificationTypes.achievements}
              onToggle={() => handleToggleNotification('achievements')}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Test Notification */}
        <div className="pt-4 border-t">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              if (notificationStatus() === 'granted') {
                new Notification('Health Tracker Reminder', {
                  body: 'Your fast is starting in 30 minutes!',
                  icon: '/favicon.ico',
                })
                toast.success('Test notification sent!')
              } else {
                toast.error('Please enable notifications first')
              }
            }}
          >
            Send Test Notification
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface NotificationToggleProps {
  icon: React.ReactNode
  title: string
  description: string
  enabled: boolean
  onToggle: () => void
  disabled?: boolean
}

function NotificationToggle({
  icon,
  title,
  description,
  enabled,
  onToggle,
  disabled
}: NotificationToggleProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-3 rounded-lg border transition-colors cursor-pointer",
        enabled ? "bg-muted/50" : "bg-background",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={!disabled ? onToggle : undefined}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-md",
          enabled ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
        )}>
          {icon}
        </div>
        <div>
          <h4 className="text-sm font-medium">{title}</h4>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        className={cn(
          "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
          enabled ? "bg-primary" : "bg-muted"
        )}
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation()
          if (!disabled) onToggle()
        }}
      >
        <span
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
            enabled ? "translate-x-5" : "translate-x-0.5"
          )}
        />
      </button>
    </div>
  )
}