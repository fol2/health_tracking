"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { StatCard } from "@/components/ui/stat-card"
import { ActionCard } from "@/components/ui/action-card"
import { DataCard } from "@/components/ui/data-card"
import { Button } from "@/components/ui/button"
import { BMIRange } from "@/components/ui/bmi-range"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { FastingCountdown } from "@/components/fasting/fasting-countdown"
import { 
  Timer, 
  Scale, 
  TrendingUp,
  TrendingDown, 
  Calendar,
  Clock,
  Activity
} from "lucide-react"

function getBMICategory(bmi: number): string {
  if (bmi < 18.5) return "Underweight"
  if (bmi < 25) return "Normal"
  if (bmi < 30) return "Overweight"
  return "Obese"
}

interface DashboardClientProps {
  user: {
    name?: string | null
  }
  data: {
    currentFast: any
    totalFastingHours: number
    lastWeight: number | null
    lastWeightDate: string | null
    weightTrend: number | null
    bmi: number | null
    bmiTrend: number | null
    upcomingFast: any
    recentActivities: any[]
  }
}

export function DashboardClient({ user, data }: DashboardClientProps) {
  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome back, {user.name?.split(' ')[0] || 'there'}!</h1>
          <p className="text-muted-foreground mt-2">
            Here's your health tracking overview for today
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/fasting">
            <ActionCard
              title="Start Fasting"
              description="Begin a new fasting session"
              icon={Timer}
              iconColor="text-green-600"
              actionLabel={data.currentFast ? "View Fast" : "Start Fast"}
              disabled={false}
            />
          </Link>
          
          <Link href="/health">
            <ActionCard
              title="Log Weight"
              description="Record your current weight"
              icon={Scale}
              iconColor="text-blue-600"
              actionLabel="Log Weight"
              disabled={false}
            />
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatCard
            title="Current Fast"
            value={data.currentFast ? "Active" : "Not Fasting"}
            description={
              data.currentFast 
                ? `${data.currentFast.type} - ${data.currentFast.targetHours}h target`
                : "Ready to start"
            }
            icon={Timer}
          />
          
          <StatCard
            title="Fasting Hours"
            value={`${Math.round(data.totalFastingHours)}h`}
            description="Total fasted"
            icon={Clock}
          />
          
          {data.currentFast ? (
            <StatCard
              title="Fasting Time"
              value=""
              customElement={
                <FastingCountdown 
                  startTime={data.currentFast.startTime} 
                  targetHours={data.currentFast.targetHours}
                  className="-mt-6"
                />
              }
              icon={Timer}
            />
          ) : (
            <StatCard
              title="Ready to Fast"
              value="—"
              description="Start a new session"
              icon={Timer}
            />
          )}
          
          <StatCard
            title="Last Weight"
            value={data.lastWeight ? `${data.lastWeight} kg` : "—"}
            description={data.lastWeightDate || "No data"}
            icon={Scale}
            trend={data.weightTrend !== null ? {
              value: Math.abs(data.weightTrend).toFixed(1),
              label: `${data.weightTrend > 0 ? '+' : ''}${data.weightTrend.toFixed(1)} kg`,
              icon: data.weightTrend > 0 ? TrendingUp : TrendingDown,
              color: data.weightTrend > 0 ? "text-red-600" : "text-green-600"
            } : undefined}
          />
          
          <StatCard
            title="BMI"
            value={data.bmi ? data.bmi.toFixed(1) : "—"}
            description={data.bmi ? getBMICategory(data.bmi) : "No data"}
            icon={Activity}
            customElement={data.bmi ? <BMIRange value={data.bmi} /> : undefined}
            trend={data.bmiTrend !== null ? {
              value: Math.abs(data.bmiTrend).toFixed(1),
              label: `${data.bmiTrend > 0 ? '+' : ''}${data.bmiTrend.toFixed(1)}`,
              icon: data.bmiTrend > 0 ? TrendingUp : TrendingDown,
              color: (() => {
                // For BMI, moving toward normal range (18.5-25) is good
                if (!data.bmi) return "text-gray-600"
                const isNormal = data.bmi >= 18.5 && data.bmi <= 25
                const wasNormal = data.bmi - data.bmiTrend >= 18.5 && data.bmi - data.bmiTrend <= 25
                
                if (isNormal && !wasNormal) return "text-green-600" // Moved into normal range
                if (!isNormal && wasNormal) return "text-red-600" // Moved out of normal range
                if (data.bmi < 18.5) return data.bmiTrend > 0 ? "text-green-600" : "text-red-600" // Underweight
                if (data.bmi > 25) return data.bmiTrend < 0 ? "text-green-600" : "text-red-600" // Overweight
                return "text-gray-600" // Normal range, any change is neutral
              })()
            } : undefined}
          />
        </div>

        {/* Overview Cards Row */}
        <div className="grid gap-6 lg:grid-cols-3">
          <DataCard
            title="Today's Activity"
            description="Your health metrics for today"
            icon={Activity}
            action={
              <Link href="/analytics">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Fasting Status</span>
                <span className={`text-sm ${data.currentFast ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {data.currentFast ? `Active (${data.currentFast.type})` : 'Not started'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Weight Logged</span>
                <span className={`text-sm ${data.lastWeight ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                  {data.lastWeight ? `${data.lastWeight} kg` : 'Not yet'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">BMI Status</span>
                <span className={`text-sm ${data.bmi ? 'font-medium' : 'text-muted-foreground'}`}>
                  {data.bmi ? `${data.bmi.toFixed(1)} - ${getBMICategory(data.bmi)}` : 'No data'}
                </span>
              </div>
            </div>
          </DataCard>

          <DataCard
            title="Upcoming Schedule"
            description="Your planned fasting sessions"
            icon={Calendar}
            action={
              <Link href="/schedule">
                <Button variant="ghost" size="sm">
                  Manage
                </Button>
              </Link>
            }
          >
            {data.upcomingFast ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">{data.upcomingFast.type} Fast</p>
                <p className="text-sm text-muted-foreground">
                  {(() => {
                    const date = new Date(data.upcomingFast.scheduledStart)
                    const dateStr = `${date.getDate()} ${date.toLocaleDateString('en-US', { month: 'short' })}`
                    const timeStr = date.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true 
                    })
                    return `${dateStr} at ${timeStr}`
                  })()}
                </p>
                <p className="text-xs text-muted-foreground">
                  {data.upcomingFast.targetHours} hour fast
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No scheduled fasts
                </p>
                <Link href="/schedule">
                  <Button variant="outline" size="sm">
                    Schedule a Fast
                  </Button>
                </Link>
              </div>
            )}
          </DataCard>

          <DataCard
            title="Recent Activity"
            description="Your latest health tracking entries"
            icon={Activity}
            action={
              data.recentActivities.length > 5 && (
                <Link href="/analytics">
                  <Button variant="ghost" size="sm">
                    See All
                  </Button>
                </Link>
              )
            }
          >
            {data.recentActivities.length > 0 ? (
              <RecentActivities activities={data.recentActivities.slice(0, 5)} />
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No activity yet. Start tracking to see your progress here.
                </p>
                <div className="flex justify-center gap-4">
                  <Link href="/fasting">
                    <Button variant="outline" size="sm">Start Fasting</Button>
                  </Link>
                  <Link href="/health">
                    <Button variant="outline" size="sm">Log Weight</Button>
                  </Link>
                </div>
              </div>
            )}
          </DataCard>
        </div>
      </div>
    </DashboardLayout>
  )
}