'use client'

import { useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { useFastingSessionStore } from '@/store'
import { 
  Trophy, 
  Clock, 
  TrendingUp, 
  Calendar, 
  BarChart3,
  Target,
  Flame,
  Award
} from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  subtitle?: string
  trend?: 'up' | 'down' | 'neutral'
}

function StatCard({ icon, label, value, subtitle, trend }: StatCardProps) {
  return (
    <Card className="p-4 bg-card/50 backdrop-blur hover:bg-card/70 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            {icon}
            <span className="text-sm font-medium">{label}</span>
          </div>
          <div className="text-2xl font-bold">{value}</div>
          {subtitle && (
            <div className="text-sm text-muted-foreground mt-1">{subtitle}</div>
          )}
        </div>
        {trend && (
          <div className={`text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 
            'text-muted-foreground'
          }`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}
          </div>
        )}
      </div>
    </Card>
  )
}

export function FastingStats() {
  const { stats, fetchStats, recentSessions } = useFastingSessionStore()

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!stats) {
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">Loading statistics...</div>
      </Card>
    )
  }

  // Calculate completion rate
  const completionRate = stats.totalSessions > 0
    ? Math.round((recentSessions.filter(s => s.status === 'completed').length / 
        recentSessions.length) * 100)
    : 0

  // Calculate weekly average
  const weeklyAverage = stats.totalSessions > 0
    ? Math.round((stats.totalHours / Math.max(1, Math.ceil(stats.totalSessions / 7))))
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Fasting Statistics</h2>
        
        {/* Main Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Clock className="h-4 w-4" />}
            label="Total Hours"
            value={stats.totalHours}
            subtitle="All time"
          />
          
          <StatCard
            icon={<Trophy className="h-4 w-4" />}
            label="Longest Fast"
            value={`${stats.longestFast}h`}
            subtitle="Personal record"
          />
          
          <StatCard
            icon={<Flame className="h-4 w-4" />}
            label="Current Streak"
            value={stats.currentStreak}
            subtitle="Days"
            trend={stats.currentStreak > 0 ? 'up' : 'neutral'}
          />
          
          <StatCard
            icon={<BarChart3 className="h-4 w-4" />}
            label="Average Duration"
            value={`${stats.averageHours}h`}
            subtitle="Per session"
          />
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Calendar className="h-4 w-4" />}
          label="Total Sessions"
          value={stats.totalSessions}
          subtitle="Fasting sessions completed"
        />
        
        <StatCard
          icon={<Target className="h-4 w-4" />}
          label="Completion Rate"
          value={`${completionRate}%`}
          subtitle="Success rate"
        />
        
        <StatCard
          icon={<Award className="h-4 w-4" />}
          label="Longest Streak"
          value={stats.longestStreak}
          subtitle="Days in a row"
        />
      </div>

      {/* Weekly Summary */}
      <Card className="p-6 bg-card/50 backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Weekly Summary
            </h3>
            <p className="text-sm text-muted-foreground">
              You're averaging {weeklyAverage} hours of fasting per week
            </p>
          </div>
          {weeklyAverage >= 16 && (
            <div className="text-green-600">
              <Award className="h-8 w-8" />
            </div>
          )}
        </div>
      </Card>

      {/* Milestones */}
      {stats.totalHours >= 100 && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-4">
            <Trophy className="h-12 w-12 text-primary" />
            <div>
              <h3 className="font-semibold text-lg">Milestone Achieved!</h3>
              <p className="text-sm text-muted-foreground">
                You've completed over {Math.floor(stats.totalHours / 100) * 100} hours of fasting
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}