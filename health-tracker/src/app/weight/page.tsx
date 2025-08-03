'use client'

import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { WeightInput } from '@/components/health/weight-input'
import { WeightProgress } from '@/components/health/weight-progress'
import { WeightHistory } from '@/components/health/weight-history'
import { WeightChart } from '@/components/health/weight-chart'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Scale } from 'lucide-react'

export default function WeightPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Scale className="h-8 w-8" />
            Weight Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            Track your weight progress and trends
          </p>
        </div>

        {/* Quick Input and Progress */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Record Weight</CardTitle>
              <CardDescription>
                Log your current weight measurement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeightInput />
            </CardContent>
          </Card>

          <WeightProgress />
        </div>

        {/* Charts and History */}
        <Tabs defaultValue="chart" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chart">Chart View</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card>
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
                <CardDescription>
                  Your weight changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeightChart />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Weight History</CardTitle>
                <CardDescription>
                  All your weight measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeightHistory />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}