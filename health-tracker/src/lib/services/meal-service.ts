import { prisma } from '@/lib/prisma'
import { MealLog, FoodItem, MealFoodItem, Prisma } from '@prisma/client'

export interface MealLogWithItems extends MealLog {
  foodItems: (MealFoodItem & { foodItem: FoodItem })[]
}

export interface CreateMealLogInput {
  userId: string
  mealType: string
  loggedAt?: Date
  notes?: string
  foodItems?: {
    foodItemId: string
    quantity: number
  }[]
}

export interface CreateFoodItemInput {
  userId?: string
  name: string
  brand?: string
  barcode?: string
  servingSize?: number
  servingUnit?: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  isPublic?: boolean
}

export interface UpdateMealLogInput {
  mealType?: string
  loggedAt?: Date
  notes?: string
  foodItems?: {
    foodItemId: string
    quantity: number
  }[]
}

// Constants for default values
const DEFAULT_SERVING_SIZE = 100
const DEFAULT_SERVING_UNIT = 'g'
const MAX_SEARCH_RESULTS = 50

// Type for nutrition totals
interface NutritionTotals {
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  totalFiber: number
}

export class MealService {
  // Private helper methods
  private readonly mealLogInclude = {
    foodItems: {
      include: {
        foodItem: true
      }
    }
  } as const

  private async calculateNutritionTotals(
    foodItems: Array<{ foodItemId: string; quantity: number }>
  ): Promise<NutritionTotals> {
    if (!foodItems?.length) {
      return {
        totalCalories: 0,
        totalProtein: 0,
        totalCarbs: 0,
        totalFat: 0,
        totalFiber: 0
      }
    }

    const foodItemDetails = await prisma.foodItem.findMany({
      where: { id: { in: foodItems.map(item => item.foodItemId) } }
    })

    return foodItems.reduce((totals, item) => {
      const food = foodItemDetails.find(f => f.id === item.foodItemId)
      if (!food) return totals

      const multiplier = item.quantity
      return {
        totalCalories: totals.totalCalories + (food.calories * multiplier),
        totalProtein: totals.totalProtein + (food.protein * multiplier),
        totalCarbs: totals.totalCarbs + (food.carbs * multiplier),
        totalFat: totals.totalFat + (food.fat * multiplier),
        totalFiber: totals.totalFiber + ((food.fiber || 0) * multiplier)
      }
    }, {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0
    })
  }

  // Meal Log operations
  async createMealLog(data: CreateMealLogInput): Promise<MealLogWithItems> {
    const { foodItems, ...mealData } = data
    const nutritionTotals = await this.calculateNutritionTotals(foodItems || [])

    return await prisma.mealLog.create({
      data: {
        ...mealData,
        ...nutritionTotals,
        foodItems: foodItems ? {
          create: foodItems.map(item => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity
          }))
        } : undefined
      },
      include: this.mealLogInclude
    })
  }

  async getMealLogs(userId: string, startDate?: Date, endDate?: Date): Promise<MealLogWithItems[]> {
    const dateFilter = startDate && endDate ? {
      loggedAt: { gte: startDate, lte: endDate }
    } : undefined

    return await prisma.mealLog.findMany({
      where: { userId, ...dateFilter },
      include: this.mealLogInclude,
      orderBy: { loggedAt: 'desc' }
    })
  }

  async getMealLogById(id: string, userId: string): Promise<MealLogWithItems | null> {
    return await prisma.mealLog.findFirst({
      where: { id, userId },
      include: this.mealLogInclude
    })
  }

  async updateMealLog(id: string, userId: string, data: UpdateMealLogInput): Promise<MealLogWithItems> {
    const { foodItems, ...mealData } = data
    
    if (!foodItems) {
      return await prisma.mealLog.update({
        where: { id, userId },
        data: mealData,
        include: this.mealLogInclude
      })
    }

    // Transaction to ensure atomicity when updating food items
    return await prisma.$transaction(async (tx) => {
      // Delete existing food items
      await tx.mealFoodItem.deleteMany({ where: { mealLogId: id } })
      
      // Calculate new totals
      const nutritionTotals = await this.calculateNutritionTotals(foodItems)
      
      // Update meal log with new data
      return await tx.mealLog.update({
        where: { id, userId },
        data: {
          ...mealData,
          ...nutritionTotals,
          foodItems: {
            create: foodItems.map(item => ({
              foodItemId: item.foodItemId,
              quantity: item.quantity
            }))
          }
        },
        include: this.mealLogInclude
      })
    })
  }

  async deleteMealLog(id: string, userId: string): Promise<void> {
    await prisma.mealLog.delete({
      where: { id, userId }
    })
  }

  // Food Item operations
  async createFoodItem(data: CreateFoodItemInput): Promise<FoodItem> {
    return await prisma.foodItem.create({
      data: {
        ...data,
        servingSize: data.servingSize ?? DEFAULT_SERVING_SIZE,
        servingUnit: data.servingUnit ?? DEFAULT_SERVING_UNIT
      }
    })
  }

  async searchFoodItems(query: string, userId?: string): Promise<FoodItem[]> {
    const searchConditions = [
      { name: { contains: query, mode: 'insensitive' as const } },
      { brand: { contains: query, mode: 'insensitive' as const } },
      { barcode: query }
    ]

    const accessConditions = userId 
      ? [{ isPublic: true }, { userId }]
      : [{ isPublic: true }]

    return await prisma.foodItem.findMany({
      where: {
        OR: searchConditions,
        AND: [{ OR: accessConditions }]
      },
      orderBy: [{ isPublic: 'asc' }, { name: 'asc' }],
      take: MAX_SEARCH_RESULTS
    })
  }

  async getFoodItemById(id: string): Promise<FoodItem | null> {
    return await prisma.foodItem.findUnique({
      where: { id }
    })
  }

  async getUserFoodItems(userId: string): Promise<FoodItem[]> {
    return await prisma.foodItem.findMany({
      where: { OR: [{ userId }, { isPublic: true }] },
      orderBy: [{ isPublic: 'asc' }, { name: 'asc' }]
    })
  }

  async updateFoodItem(id: string, userId: string, data: Partial<CreateFoodItemInput>): Promise<FoodItem> {
    return await prisma.foodItem.update({
      where: { id, userId },
      data
    })
  }

  async deleteFoodItem(id: string, userId: string): Promise<void> {
    await prisma.foodItem.delete({
      where: { id, userId }
    })
  }

  // Statistics
  async getDailyNutrition(userId: string, date: Date): Promise<NutritionTotals & { mealCount: number }> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const meals = await this.getMealLogs(userId, startOfDay, endOfDay)
    
    const initialTotals: NutritionTotals & { mealCount: number } = {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      mealCount: 0
    }

    return meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.totalCalories ?? 0),
      totalProtein: acc.totalProtein + (meal.totalProtein ?? 0),
      totalCarbs: acc.totalCarbs + (meal.totalCarbs ?? 0),
      totalFat: acc.totalFat + (meal.totalFat ?? 0),
      totalFiber: acc.totalFiber + (meal.totalFiber ?? 0),
      mealCount: acc.mealCount + 1
    }), initialTotals)
  }
}

export const mealService = new MealService()