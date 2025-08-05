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

export class MealService {
  // Meal Log operations
  async createMealLog(data: CreateMealLogInput): Promise<MealLogWithItems> {
    const { foodItems, ...mealData } = data
    
    // Calculate totals if food items are provided
    let totalCalories = 0
    let totalProtein = 0
    let totalCarbs = 0
    let totalFat = 0
    let totalFiber = 0
    
    if (foodItems && foodItems.length > 0) {
      const foodItemDetails = await prisma.foodItem.findMany({
        where: {
          id: { in: foodItems.map(item => item.foodItemId) }
        }
      })
      
      foodItems.forEach(item => {
        const food = foodItemDetails.find(f => f.id === item.foodItemId)
        if (food) {
          const multiplier = item.quantity
          totalCalories += food.calories * multiplier
          totalProtein += food.protein * multiplier
          totalCarbs += food.carbs * multiplier
          totalFat += food.fat * multiplier
          totalFiber += (food.fiber || 0) * multiplier
        }
      })
    }
    
    return await prisma.mealLog.create({
      data: {
        ...mealData,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFiber,
        foodItems: foodItems ? {
          create: foodItems.map(item => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity
          }))
        } : undefined
      },
      include: {
        foodItems: {
          include: {
            foodItem: true
          }
        }
      }
    })
  }

  async getMealLogs(userId: string, startDate?: Date, endDate?: Date): Promise<MealLogWithItems[]> {
    const where: Prisma.MealLogWhereInput = {
      userId,
      ...(startDate && endDate ? {
        loggedAt: {
          gte: startDate,
          lte: endDate
        }
      } : {})
    }

    return await prisma.mealLog.findMany({
      where,
      include: {
        foodItems: {
          include: {
            foodItem: true
          }
        }
      },
      orderBy: {
        loggedAt: 'desc'
      }
    })
  }

  async getMealLogById(id: string, userId: string): Promise<MealLogWithItems | null> {
    return await prisma.mealLog.findFirst({
      where: {
        id,
        userId
      },
      include: {
        foodItems: {
          include: {
            foodItem: true
          }
        }
      }
    })
  }

  async updateMealLog(id: string, userId: string, data: UpdateMealLogInput): Promise<MealLogWithItems> {
    const { foodItems, ...mealData } = data
    
    // If food items are being updated, recalculate totals
    let updateData: any = { ...mealData }
    
    if (foodItems) {
      // Delete existing food items
      await prisma.mealFoodItem.deleteMany({
        where: { mealLogId: id }
      })
      
      // Calculate new totals
      let totalCalories = 0
      let totalProtein = 0
      let totalCarbs = 0
      let totalFat = 0
      let totalFiber = 0
      
      const foodItemDetails = await prisma.foodItem.findMany({
        where: {
          id: { in: foodItems.map(item => item.foodItemId) }
        }
      })
      
      foodItems.forEach(item => {
        const food = foodItemDetails.find(f => f.id === item.foodItemId)
        if (food) {
          const multiplier = item.quantity
          totalCalories += food.calories * multiplier
          totalProtein += food.protein * multiplier
          totalCarbs += food.carbs * multiplier
          totalFat += food.fat * multiplier
          totalFiber += (food.fiber || 0) * multiplier
        }
      })
      
      updateData = {
        ...updateData,
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        totalFiber,
        foodItems: {
          create: foodItems.map(item => ({
            foodItemId: item.foodItemId,
            quantity: item.quantity
          }))
        }
      }
    }
    
    return await prisma.mealLog.update({
      where: {
        id,
        userId
      },
      data: updateData,
      include: {
        foodItems: {
          include: {
            foodItem: true
          }
        }
      }
    })
  }

  async deleteMealLog(id: string, userId: string): Promise<void> {
    await prisma.mealLog.delete({
      where: {
        id,
        userId
      }
    })
  }

  // Food Item operations
  async createFoodItem(data: CreateFoodItemInput): Promise<FoodItem> {
    return await prisma.foodItem.create({
      data: {
        ...data,
        servingSize: data.servingSize || 100,
        servingUnit: data.servingUnit || 'g'
      }
    })
  }

  async searchFoodItems(query: string, userId?: string): Promise<FoodItem[]> {
    return await prisma.foodItem.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { brand: { contains: query, mode: 'insensitive' } },
          { barcode: query }
        ],
        AND: [
          {
            OR: [
              { isPublic: true },
              { userId: userId || undefined }
            ]
          }
        ]
      },
      orderBy: [
        { isPublic: 'asc' },
        { name: 'asc' }
      ],
      take: 50
    })
  }

  async getFoodItemById(id: string): Promise<FoodItem | null> {
    return await prisma.foodItem.findUnique({
      where: { id }
    })
  }

  async getUserFoodItems(userId: string): Promise<FoodItem[]> {
    return await prisma.foodItem.findMany({
      where: {
        OR: [
          { userId },
          { isPublic: true }
        ]
      },
      orderBy: [
        { isPublic: 'asc' },
        { name: 'asc' }
      ]
    })
  }

  async updateFoodItem(id: string, userId: string, data: Partial<CreateFoodItemInput>): Promise<FoodItem> {
    return await prisma.foodItem.update({
      where: {
        id,
        userId
      },
      data
    })
  }

  async deleteFoodItem(id: string, userId: string): Promise<void> {
    await prisma.foodItem.delete({
      where: {
        id,
        userId
      }
    })
  }

  // Statistics
  async getDailyNutrition(userId: string, date: Date): Promise<{
    totalCalories: number
    totalProtein: number
    totalCarbs: number
    totalFat: number
    totalFiber: number
    mealCount: number
  }> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)
    
    const meals = await this.getMealLogs(userId, startOfDay, endOfDay)
    
    const totals = meals.reduce((acc, meal) => ({
      totalCalories: acc.totalCalories + (meal.totalCalories || 0),
      totalProtein: acc.totalProtein + (meal.totalProtein || 0),
      totalCarbs: acc.totalCarbs + (meal.totalCarbs || 0),
      totalFat: acc.totalFat + (meal.totalFat || 0),
      totalFiber: acc.totalFiber + (meal.totalFiber || 0),
      mealCount: acc.mealCount + 1
    }), {
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalFiber: 0,
      mealCount: 0
    })
    
    return totals
  }
}

export const mealService = new MealService()