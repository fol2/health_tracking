'use client'

import { useState } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeightInput } from '@/components/health/weight-input'
import { WeightHistory } from '@/components/health/weight-history'
import { WeightProgress } from '@/components/health/weight-progress'
import { HealthMetricsForm } from '@/components/health/health-metrics-form'
import { RecentMetrics } from '@/components/health/recent-metrics'
import { WeightChart } from '@/components/health/weight-chart'
import { Scale, Activity, ChartLine, Plus } from 'lucide-react'

export default function HealthPage() {
  const [activeTab, setActiveTab] = useState('weight')
  const [refreshKey, setRefreshKey] = useState(0)

  const handleWeightAdded = () => {
    // Trigger a refresh of weight-related components
    setRefreshKey(prev => prev + 1)
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Health Tracking</h1>
          <p className="text-muted-foreground mt-2">
            Monitor your weight and health metrics
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="weight" className="flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Weight
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <ChartLine className="h-4 w-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="weight" className="space-y-6">
            {/* Weight Progress Overview */}
            <div key={`progress-${refreshKey}`}>
              <WeightProgress />
            </div>

            {/* Weight Input and Recent History */}
            <div className="grid gap-6 lg:grid-cols-2">
              <WeightInput onSuccess={handleWeightAdded} />
              <div key={`history-${refreshKey}`}>
                <WeightHistory />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <HealthMetricsForm />
              <RecentMetrics />
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <div className="grid gap-6">
              <WeightChart days={30} />
              <WeightHistory />
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Health Metrics History</h3>
                <p className="text-sm text-muted-foreground">
                  Full history view coming soon...
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Floating Action Button for Quick Weight Entry */}
        <WeightInput compact onSuccess={handleWeightAdded} />
      </div>
    </ProtectedRoute>
  )
}