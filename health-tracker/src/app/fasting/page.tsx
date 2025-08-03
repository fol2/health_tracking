'use client'

import { useEffect } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { FastingTimer } from '@/components/fasting/fasting-timer'
import { FastingControls } from '@/components/fasting/fasting-controls'
import { FastingHistory } from '@/components/fasting/fasting-history'
import { FastingStats } from '@/components/fasting/fasting-stats'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useFastingSessionStore } from '@/store'
import { Timer, History, BarChart3 } from 'lucide-react'

export default function FastingPage() {
  const { activeSession, fetchActiveSession, fetchRecentSessions, fetchStats } = useFastingSessionStore()

  useEffect(() => {
    // Load data on mount
    fetchActiveSession()
    fetchRecentSessions()
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Fasting Tracker</h1>
          <p className="text-muted-foreground">
            Track your intermittent fasting journey and monitor your progress
          </p>
        </div>

        {/* Active Session or Start Controls */}
        <div className="mb-8">
          {activeSession ? (
            <FastingTimer />
          ) : (
            <FastingControls />
          )}
        </div>

        {/* Tabs for History and Stats */}
        <Tabs defaultValue="stats" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stats" className="space-y-4">
            <FastingStats />
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <FastingHistory />
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  )
}