'use client'

import { useState } from 'react'
import { format, subDays, startOfDay, endOfDay } from 'date-fns'
import { Calendar, Download, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeightChart } from '@/components/analytics/weight-chart'
import { FastingAnalytics } from '@/components/analytics/fasting-analytics'
import { HealthMetricsCharts } from '@/components/analytics/health-metrics-charts'
import { SummaryCards } from '@/components/analytics/summary-cards'
import { ExportData } from '@/components/analytics/export-data'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { useAuth } from '@/hooks/use-auth'

const DATE_RANGES = {
  '7d': { label: 'Last 7 days', days: 7 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
  '180d': { label: 'Last 6 months', days: 180 },
  '365d': { label: 'Last year', days: 365 },
}

export default function AnalyticsPage() {
  const { user } = useAuth()
  const [dateRange, setDateRange] = useState('30d')
  const [showExport, setShowExport] = useState(false)

  const range = DATE_RANGES[dateRange as keyof typeof DATE_RANGES]
  const startDate = startOfDay(subDays(new Date(), range.days))
  const endDate = endOfDay(new Date())

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">Please log in to view analytics</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Analytics Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your health progress and insights
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(DATE_RANGES).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {value.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button
              variant="outline"
              onClick={() => setShowExport(true)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <SummaryCards startDate={startDate} endDate={endDate} />

        {/* Main Analytics Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="weight">Weight</TabsTrigger>
            <TabsTrigger value="fasting">Fasting</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Weight Progress</CardTitle>
                  <CardDescription>
                    Your weight trend over {range.label.toLowerCase()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <WeightChart
                    startDate={startDate}
                    endDate={endDate}
                    height={300}
                    showBMI={false}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Fasting Overview</CardTitle>
                  <CardDescription>
                    Total fasting hours by week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FastingAnalytics
                    startDate={startDate}
                    endDate={endDate}
                    view="weekly"
                    chartType="hours"
                  />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Health Metrics</CardTitle>
                <CardDescription>
                  Recent health measurements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <HealthMetricsCharts
                  startDate={startDate}
                  endDate={endDate}
                  metrics={['blood_pressure', 'heart_rate']}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="weight" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Weight Analysis</CardTitle>
                <CardDescription>
                  Detailed weight tracking with BMI zones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WeightChart
                  startDate={startDate}
                  endDate={endDate}
                  height={400}
                  showBMI={true}
                  showTarget={true}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fasting" className="space-y-4">
            <FastingAnalytics
              startDate={startDate}
              endDate={endDate}
              view="detailed"
            />
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <HealthMetricsCharts
              startDate={startDate}
              endDate={endDate}
              detailed={true}
            />
          </TabsContent>
        </Tabs>

        {/* Export Dialog */}
        {showExport && (
          <ExportData
            startDate={startDate}
            endDate={endDate}
            onClose={() => setShowExport(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}