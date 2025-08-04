"use client"

import Link from "next/link"
import { DashboardLayout } from "@/components/layouts/dashboard-layout"
import { StatCard } from "@/components/ui/stat-card"
import { ActionCard } from "@/components/ui/action-card"
import { DataCard } from "@/components/ui/data-card"
import { Button } from "@/components/ui/button"
import { 
  Timer, 
  Scale, 
  TrendingUp, 
  Calendar,
  Clock,
  Activity
} from "lucide-react"

interface DashboardClientProps {
  user: {
    name?: string | null
  }
  data: {
    currentFast: any
    totalFastingHours: number
    currentStreak: number
    lastWeight: null
    upcomingFast: null
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
          
          <ActionCard
            title="Log Weight"
            description="Record your current weight"
            icon={Scale}
            iconColor="text-blue-600"
            actionLabel="Log Weight"
            onAction={() => console.log("Log weight")}
          />
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
            value={data.totalFastingHours}
            description="This month"
            icon={Clock}
            trend={{ value: 12, label: "vs last month" }}
          />
          
          <StatCard
            title="Current Streak"
            value={`${data.currentStreak} days`}
            description="Keep it up!"
            icon={TrendingUp}
          />
          
          <StatCard
            title="Last Weight"
            value={data.lastWeight || "—"}
            description="No data yet"
            icon={Scale}
          />
        </div>

        {/* Today's Overview */}
        <div className="grid gap-6 lg:grid-cols-2">
          <DataCard
            title="Today's Activity"
            description="Your health metrics for today"
            icon={Activity}
            action={
              <Button variant="ghost" size="sm">
                View All
              </Button>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Fasting Status</span>
                <span className="text-sm text-muted-foreground">Not started</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Weight Logged</span>
                <span className="text-sm text-muted-foreground">Not yet</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium">Health Metrics</span>
                <span className="text-sm text-muted-foreground">0 recorded</span>
              </div>
            </div>
          </DataCard>

          <DataCard
            title="Upcoming Schedule"
            description="Your planned fasting sessions"
            icon={Calendar}
            action={
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            }
          >
            {data.upcomingFast ? (
              <div className="space-y-2">
                <p className="text-sm font-medium">Next fast scheduled</p>
                <p className="text-sm text-muted-foreground">
                  Tomorrow at 8:00 PM
                </p>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  No scheduled fasts
                </p>
                <Button variant="outline" size="sm">
                  Schedule a Fast
                </Button>
              </div>
            )}
          </DataCard>
        </div>

        {/* Recent Activity */}
        <DataCard
          title="Recent Activity"
          description="Your latest health tracking entries"
          icon={Activity}
        >
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              No activity yet. Start tracking to see your progress here.
            </p>
            <div className="flex justify-center gap-4">
              <Button variant="outline">Start Fasting</Button>
              <Button variant="outline">Log Weight</Button>
            </div>
          </div>
        </DataCard>
      </div>
    </DashboardLayout>
  )
}