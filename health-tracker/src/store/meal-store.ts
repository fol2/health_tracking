import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
}

export interface MealLogItem {
  foodItem: FoodItem
  quantity: number
}

export interface MealLog {
  id: string
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  loggedAt: string
  notes?: string
  totalCalories?: number
  totalProtein?: number
  totalCarbs?: number
  totalFat?: number
  totalFiber?: number
  foodItems: MealLogItem[]
}

interface MealStore {
  meals: MealLog[]
  todayMeals: MealLog[]
  foodItems: FoodItem[]
  isLoading: boolean
  
  setMeals: (meals: MealLog[]) => void
  setTodayMeals: (meals: MealLog[]) => void
  setFoodItems: (items: FoodItem[]) => void
  setLoading: (loading: boolean) => void
  
  addMeal: (meal: MealLog) => void
  updateMeal: (id: string, meal: Partial<MealLog>) => void
  deleteMeal: (id: string) => void
  
  addFoodItem: (item: FoodItem) => void
  
  clearStore: () => void
}

export const useMealStore = create<MealStore>()(
  persist(
    (set) => ({
      meals: [],
      todayMeals: [],
      foodItems: [],
      isLoading: false,
      
      setMeals: (meals) => set({ meals }),
      setTodayMeals: (meals) => set({ todayMeals: meals }),
      setFoodItems: (items) => set({ foodItems: items }),
      setLoading: (loading) => set({ isLoading: loading }),
      
      addMeal: (meal) => set((state) => ({
        meals: [meal, ...state.meals],
        todayMeals: isToday(meal.loggedAt) 
          ? [meal, ...state.todayMeals]
          : state.todayMeals
      })),
      
      updateMeal: (id, updatedMeal) => set((state) => ({
        meals: state.meals.map(meal => 
          meal.id === id ? { ...meal, ...updatedMeal } : meal
        ),
        todayMeals: state.todayMeals.map(meal => 
          meal.id === id ? { ...meal, ...updatedMeal } : meal
        )
      })),
      
      deleteMeal: (id) => set((state) => ({
        meals: state.meals.filter(meal => meal.id !== id),
        todayMeals: state.todayMeals.filter(meal => meal.id !== id)
      })),
      
      addFoodItem: (item) => set((state) => ({
        foodItems: [item, ...state.foodItems]
      })),
      
      clearStore: () => set({
        meals: [],
        todayMeals: [],
        foodItems: [],
        isLoading: false
      })
    }),
    {
      name: 'meal-store',
      partialize: (state) => ({
        foodItems: state.foodItems
      })
    }
  )
)

function isToday(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  return date.toDateString() === today.toDateString()
}