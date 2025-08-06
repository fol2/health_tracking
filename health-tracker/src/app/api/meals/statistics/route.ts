import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { mealService } from '@/lib/services/meal-service'
import { prisma } from '@/lib/prisma'
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const period = searchParams.get('period') || 'week'
    const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date()

    let startDate: Date
    let endDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(date)
        startDate.setHours(0, 0, 0, 0)
        endDate = new Date(date)
        endDate.setHours(23, 59, 59, 999)
        break
      case 'week':
        startDate = startOfWeek(date, { weekStartsOn: 1 })
        endDate = endOfWeek(date, { weekStartsOn: 1 })
        break
      case 'month':
        startDate = startOfMonth(date)
        endDate = endOfMonth(date)
        break
      case 'last7days':
        endDate = new Date()
        startDate = subDays(endDate, 7)
        break
      case 'last30days':
        endDate = new Date()
        startDate = subDays(endDate, 30)
        break
      default:
        startDate = startOfWeek(date, { weekStartsOn: 1 })
        endDate = endOfWeek(date, { weekStartsOn: 1 })
    }

    const meals = await mealService.getMealLogs(session.user.id, startDate, endDate)

    const dailyStats = new Map<string, any>()
    
    meals.forEach(meal => {
      const dateKey = new Date(meal.loggedAt).toDateString()
      if (!dailyStats.has(dateKey)) {
        dailyStats.set(dateKey, {
          date: dateKey,
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          totalFiber: 0,
          mealCount: 0,
          mealTypes: {
            breakfast: 0,
            lunch: 0,
            dinner: 0,
            snack: 0
          }
        })
      }
      
      const stats = dailyStats.get(dateKey)
      stats.totalCalories += meal.totalCalories || 0
      stats.totalProtein += meal.totalProtein || 0
      stats.totalCarbs += meal.totalCarbs || 0
      stats.totalFat += meal.totalFat || 0
      stats.totalFiber += meal.totalFiber || 0
      stats.mealCount += 1
      stats.mealTypes[meal.mealType as keyof typeof stats.mealTypes] += 1
    })

    const summary = {
      period,
      startDate,
      endDate,
      totalMeals: meals.length,
      totalCalories: meals.reduce((sum, meal) => sum + (meal.totalCalories || 0), 0),
      totalProtein: meals.reduce((sum, meal) => sum + (meal.totalProtein || 0), 0),
      totalCarbs: meals.reduce((sum, meal) => sum + (meal.totalCarbs || 0), 0),
      totalFat: meals.reduce((sum, meal) => sum + (meal.totalFat || 0), 0),
      totalFiber: meals.reduce((sum, meal) => sum + (meal.totalFiber || 0), 0),
      averageCaloriesPerDay: 0,
      averageProteinPerDay: 0,
      averageCarbsPerDay: 0,
      averageFatPerDay: 0,
      dailyBreakdown: Array.from(dailyStats.values())
    }

    const daysInPeriod = dailyStats.size || 1
    summary.averageCaloriesPerDay = Math.round(summary.totalCalories / daysInPeriod)
    summary.averageProteinPerDay = Math.round(summary.totalProtein / daysInPeriod)
    summary.averageCarbsPerDay = Math.round(summary.totalCarbs / daysInPeriod)
    summary.averageFatPerDay = Math.round(summary.totalFat / daysInPeriod)

    const topFoods = await prisma.$queryRaw`
      SELECT 
        fi.name,
        fi.brand,
        COUNT(mfi.id) as usage_count,
        SUM(mfi.quantity * fi.calories) as total_calories
      FROM "MealFoodItem" mfi
      JOIN "FoodItem" fi ON mfi."foodItemId" = fi.id
      JOIN "MealLog" ml ON mfi."mealLogId" = ml.id
      WHERE ml."userId" = ${session.user.id}
        AND ml."loggedAt" >= ${startDate}
        AND ml."loggedAt" <= ${endDate}
      GROUP BY fi.id, fi.name, fi.brand
      ORDER BY usage_count DESC
      LIMIT 10
    ` as any[]

    return NextResponse.json({
      summary,
      topFoods: topFoods.map(food => ({
        ...food,
        usage_count: Number(food.usage_count),
        total_calories: Number(food.total_calories)
      }))
    })
  } catch (error) {
    console.error('Error fetching meal statistics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch meal statistics' },
      { status: 500 }
    )
  }
}