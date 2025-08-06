'use client'

import { useState, useRef } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Calendar, BarChart3, BookOpen, History, Download, Settings } from 'lucide-react'
import { MealLogForm } from '@/components/meals/meal-log-form'
import { MealList } from '@/components/meals/meal-list'
import { MealStatistics } from '@/components/meals/meal-statistics'
import { MealTemplates } from '@/components/meals/meal-templates'
import { MealHistory } from '@/components/meals/meal-history'
import { NutritionGoals } from '@/components/meals/nutrition-goals'
import { FoodDatabase } from '@/components/meals/food-database'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function MealsPage() {
  const [showAddMeal, setShowAddMeal] = useState(false)
  const [activeTab, setActiveTab] = useState('today')
  const mealListRef = useRef<{ fetchTodayMeals: () => void }>(null)

  const handleExportData = async () => {
    try {
      const response = await fetch('/api/meals/export?format=csv')
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meals-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Meal Tracking</h1>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportData}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button onClick={() => setShowAddMeal(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Meal
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="today" className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Today</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                <span className="hidden sm:inline">Stats</span>
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Templates</span>
              </TabsTrigger>
              <TabsTrigger value="history" className="flex items-center gap-1">
                <History className="h-4 w-4" />
                <span className="hidden sm:inline">History</span>
              </TabsTrigger>
              <TabsTrigger value="goals" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Goals</span>
              </TabsTrigger>
              <TabsTrigger value="database" className="flex items-center gap-1">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Foods</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="today" className="mt-6">
              <MealList ref={mealListRef} />
            </TabsContent>

            <TabsContent value="statistics" className="mt-6">
              <MealStatistics />
            </TabsContent>

            <TabsContent value="templates" className="mt-6">
              <MealTemplates />
            </TabsContent>

            <TabsContent value="history" className="mt-6">
              <MealHistory />
            </TabsContent>

            <TabsContent value="goals" className="mt-6">
              <NutritionGoals />
            </TabsContent>

            <TabsContent value="database" className="mt-6">
              <FoodDatabase />
            </TabsContent>
          </Tabs>

          <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log a New Meal</DialogTitle>
              </DialogHeader>
              <MealLogForm 
                onSuccess={() => {
                  setShowAddMeal(false)
                  mealListRef.current?.fetchTodayMeals()
                }}
                onCancel={() => setShowAddMeal(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}