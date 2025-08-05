'use client'

import { useState, useRef } from 'react'
import { ProtectedRoute } from '@/components/auth/protected-route'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { MealLogForm } from '@/components/meals/meal-log-form'
import { MealList } from '@/components/meals/meal-list'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export default function MealsPage() {
  const [showAddMeal, setShowAddMeal] = useState(false)
  const mealListRef = useRef<{ fetchTodayMeals: () => void }>(null)

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="container mx-auto p-4 max-w-4xl">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Meal Tracking</h1>
            <Button onClick={() => setShowAddMeal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Log Meal
            </Button>
          </div>

          <MealList ref={mealListRef} />

          <Dialog open={showAddMeal} onOpenChange={setShowAddMeal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Log a New Meal</DialogTitle>
              </DialogHeader>
              <MealLogForm 
                onSuccess={() => {
                  setShowAddMeal(false)
                  // Refresh the meal list instead of reloading
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