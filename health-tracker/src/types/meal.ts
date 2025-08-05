// Shared types for meal-related components
export interface NutritionData {
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
}

export interface FoodItem {
  id: string
  name: string
  brand?: string
  servingSize: number
  servingUnit: string
  calories: number
  protein: number
  carbs: number
  fat: number
  fiber?: number
  sugar?: number
  sodium?: number
  isPublic?: boolean
}

export interface MealFoodItem {
  id?: string
  quantity?: number
  foodItem: {
    id: string
    name: string
  } & Partial<NutritionData>
}

export interface MealLog {
  id: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  loggedAt: string
  totalCalories?: number
  totalProtein?: number
  totalCarbs?: number
  totalFat?: number
  totalFiber?: number
  notes?: string
  foodItems: MealFoodItem[]
}

export const MEAL_TYPE_OPTIONS = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
] as const

export const MEAL_TYPE_COLORS = {
  breakfast: 'bg-yellow-500',
  lunch: 'bg-blue-500',
  dinner: 'bg-purple-500',
  snack: 'bg-green-500'
} as const