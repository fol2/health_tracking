"use client"

import { 
  Scale, 
  Timer, 
  Activity,
  Heart,
  Droplets,
  Moon,
  Battery,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { cn } from "@/lib/utils"

interface Activity {
  type: 'weight' | 'metric' | 'fasting'
  date: Date | string
  data: any
}

interface RecentActivitiesProps {
  activities: Activity[]
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No activity yet. Start tracking to see your progress here.
        </p>
      </div>
    )
  }

  const getActivityIcon = (activity: Activity) => {
    if (activity.type === 'weight') return Scale
    if (activity.type === 'fasting') {
      return activity.data.status === 'completed' ? CheckCircle : 
             activity.data.status === 'cancelled' ? XCircle : Timer
    }
    // For metrics, use specific icons based on metric type
    const metricType = activity.data.metricType
    if (metricType === 'heart_rate') return Heart
    if (metricType === 'blood_pressure') return Heart
    if (metricType === 'blood_glucose') return Droplets
    if (metricType === 'sleep_hours') return Moon
    if (metricType === 'energy_level') return Battery
    return Activity
  }

  const getActivityTitle = (activity: Activity) => {
    if (activity.type === 'weight') {
      return `Weight: ${activity.data.weight} kg`
    }
    if (activity.type === 'fasting') {
      const status = activity.data.status
      if (status === 'active') return `Started ${activity.data.type} fast`
      if (status === 'completed') return `Completed ${activity.data.type} fast`
      if (status === 'cancelled') return `Cancelled ${activity.data.type} fast`
      return `${activity.data.type} fast`
    }
    // For metrics
    const metricType = activity.data.metricType.replace(/_/g, ' ')
    const value = typeof activity.data.value === 'object' 
      ? `${activity.data.value.systolic}/${activity.data.value.diastolic}` 
      : activity.data.value
    const unit = activity.data.unit || ''
    return `${metricType}: ${value} ${unit}`.trim()
  }

  const getActivityDescription = (activity: Activity) => {
    if (activity.type === 'weight' && activity.data.notes) {
      return activity.data.notes
    }
    if (activity.type === 'fasting') {
      if (activity.data.status === 'completed') {
        const duration = Math.round((new Date(activity.data.endTime).getTime() - new Date(activity.data.startTime).getTime()) / (1000 * 60 * 60))
        return `${duration} hours (${activity.data.targetHours}h target)`
      }
      if (activity.data.status === 'active') {
        return `Target: ${activity.data.targetHours} hours`
      }
      return activity.data.notes || ''
    }
    return activity.data.notes || ''
  }

  const getActivityColor = (activity: Activity) => {
    if (activity.type === 'weight') return 'text-blue-600'
    if (activity.type === 'fasting') {
      if (activity.data.status === 'completed') return 'text-green-600'
      if (activity.data.status === 'cancelled') return 'text-red-600'
      return 'text-yellow-600'
    }
    return 'text-purple-600'
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, index) => {
        const Icon = getActivityIcon(activity)
        const title = getActivityTitle(activity)
        const description = getActivityDescription(activity)
        const color = getActivityColor(activity)
        const timeAgo = formatDistanceToNow(new Date(activity.date), { addSuffix: true })

        return (
          <div
            key={index}
            className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-0"
          >
            <div className={cn("mt-0.5", color)}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium leading-none">
                {title}
              </p>
              {description && (
                <p className="text-xs text-muted-foreground">
                  {description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {timeAgo}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}