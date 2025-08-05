import { useState } from 'react'
import { NutritionData } from '@/types/meal'

interface UseNutritionFormOptions {
  initialValues?: Partial<NutritionData>
  required?: (keyof NutritionData)[]
}

export function useNutritionForm({ 
  initialValues = {}, 
  required = ['calories', 'protein', 'carbs', 'fat'] 
}: UseNutritionFormOptions = {}) {
  const [values, setValues] = useState<Partial<NutritionData>>({
    calories: initialValues.calories ?? 0,
    protein: initialValues.protein ?? 0,
    carbs: initialValues.carbs ?? 0,
    fat: initialValues.fat ?? 0,
    fiber: initialValues.fiber,
    sugar: initialValues.sugar,
    sodium: initialValues.sodium
  })

  const updateField = (field: keyof NutritionData, value: string) => {
    const numValue = parseFloat(value) || 0
    setValues(prev => ({ ...prev, [field]: numValue }))
  }

  const getFieldValue = (field: keyof NutritionData): string => {
    return values[field]?.toString() || ''
  }

  const validate = (): boolean => {
    return required.every(field => {
      const value = values[field]
      return value !== undefined && value !== null && value >= 0
    })
  }

  const reset = () => {
    setValues({
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: undefined,
      sugar: undefined,
      sodium: undefined
    })
  }

  const getNutritionData = (): NutritionData => {
    return {
      calories: values.calories ?? 0,
      protein: values.protein ?? 0,
      carbs: values.carbs ?? 0,
      fat: values.fat ?? 0,
      fiber: values.fiber,
      sugar: values.sugar,
      sodium: values.sodium
    }
  }

  return {
    values,
    updateField,
    getFieldValue,
    validate,
    reset,
    getNutritionData
  }
}