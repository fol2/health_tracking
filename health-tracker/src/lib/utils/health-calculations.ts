// Health calculations and unit conversion utilities

export const WeightUnits = {
  KG: 'kg',
  LBS: 'lbs',
  STONE: 'stone',
} as const

export type WeightUnit = typeof WeightUnits[keyof typeof WeightUnits]

export const HeightUnits = {
  CM: 'cm',
  FT: 'ft',
  IN: 'in',
} as const

export type HeightUnit = typeof HeightUnits[keyof typeof HeightUnits]

// Weight conversions
export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return value

  // Convert to kg first
  let kg = value
  if (from === WeightUnits.LBS) {
    kg = value * 0.453592
  } else if (from === WeightUnits.STONE) {
    kg = value * 6.35029
  }

  // Convert from kg to target unit
  if (to === WeightUnits.LBS) {
    return kg * 2.20462
  } else if (to === WeightUnits.STONE) {
    return kg * 0.157473
  }

  return kg
}

// Height conversions
export const convertHeight = (value: number, from: HeightUnit, to: HeightUnit): number => {
  if (from === to) return value

  // Convert to cm first
  let cm = value
  if (from === HeightUnits.FT) {
    cm = value * 30.48
  } else if (from === HeightUnits.IN) {
    cm = value * 2.54
  }

  // Convert from cm to target unit
  if (to === HeightUnits.FT) {
    return cm / 30.48
  } else if (to === HeightUnits.IN) {
    return cm / 2.54
  }

  return cm
}

// BMI calculations
export const calculateBMI = (weightKg: number, heightCm: number): number => {
  const heightM = heightCm / 100
  return weightKg / (heightM * heightM)
}

export const getBMICategory = (bmi: number): { category: string; color: string } => {
  if (bmi < 18.5) {
    return { category: 'Underweight', color: 'text-blue-500' }
  } else if (bmi < 25) {
    return { category: 'Normal weight', color: 'text-green-500' }
  } else if (bmi < 30) {
    return { category: 'Overweight', color: 'text-yellow-500' }
  } else {
    return { category: 'Obese', color: 'text-red-500' }
  }
}

// Weight change calculations
export const calculateWeightChange = (
  currentWeight: number,
  previousWeight: number
): { absolute: number; percent: number; direction: 'up' | 'down' | 'same' } => {
  const absolute = currentWeight - previousWeight
  const percent = (absolute / previousWeight) * 100

  return {
    absolute: Math.abs(absolute),
    percent: Math.abs(percent),
    direction: absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'same',
  }
}

// Format weight with unit
export const formatWeight = (weight: number, unit: WeightUnit, decimals = 1): string => {
  return `${weight.toFixed(decimals)} ${unit}`
}

// Format height with unit
export const formatHeight = (height: number, unit: HeightUnit): string => {
  if (unit === HeightUnits.FT) {
    const feet = Math.floor(height)
    const inches = Math.round((height - feet) * 12)
    return `${feet}'${inches}"`
  }
  return `${height.toFixed(0)} ${unit}`
}

// Date formatting for health records
export const formatHealthDate = (date: Date | string): string => {
  const d = new Date(date)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return `Today at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  } else if (d.toDateString() === yesterday.toDateString()) {
    return `Yesterday at ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}`
  } else {
    return d.toLocaleDateString('en-GB', { 
      day: 'numeric', 
      month: 'short', 
      year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

// Validation helpers
export const isValidWeight = (weight: number, unit: WeightUnit): boolean => {
  const weightKg = unit === WeightUnits.KG ? weight : convertWeight(weight, unit, WeightUnits.KG)
  return weightKg > 0 && weightKg < 635 // Max recorded human weight
}

export const isValidHeight = (height: number, unit: HeightUnit): boolean => {
  const heightCm = unit === HeightUnits.CM ? height : convertHeight(height, unit, HeightUnits.CM)
  return heightCm > 50 && heightCm < 275 // Reasonable human height range
}

// Health metric ranges
export const HealthMetricRanges = {
  bloodPressure: {
    systolic: { min: 70, max: 190, normal: { min: 90, max: 120 } },
    diastolic: { min: 40, max: 130, normal: { min: 60, max: 80 } },
  },
  heartRate: { min: 40, max: 200, normal: { min: 60, max: 100 } },
  bloodGlucose: { min: 20, max: 600, normal: { min: 70, max: 140 } }, // mg/dL
  bodyTemperature: { min: 35, max: 42, normal: { min: 36.1, max: 37.2 } }, // Celsius
  oxygenSaturation: { min: 70, max: 100, normal: { min: 95, max: 100 } },
  sleepHours: { min: 0, max: 24, normal: { min: 7, max: 9 } },
  waterIntake: { min: 0, max: 10, normal: { min: 2, max: 3 } }, // Litres
  steps: { min: 0, max: 100000, normal: { min: 8000, max: 10000 } },
  energyLevel: { min: 1, max: 10, normal: { min: 6, max: 8 } },
}

export const isInNormalRange = (value: number, metricType: keyof typeof HealthMetricRanges): boolean => {
  const range = HealthMetricRanges[metricType]
  if (!range) return true
  
  // Special handling for blood pressure which has systolic/diastolic sub-properties
  if (metricType === 'bloodPressure') {
    // For blood pressure, we can't determine normal range with a single value
    // This function would need both systolic and diastolic values
    return true
  }
  
  // For all other metrics with direct normal range
  if ('normal' in range && 'min' in range && 'max' in range) {
    return value >= range.normal.min && value <= range.normal.max
  }
  
  return true
}

// Blood pressure validation helper
export const isBloodPressureInNormalRange = (systolic: number, diastolic: number): boolean => {
  const bpRange = HealthMetricRanges.bloodPressure
  return (
    systolic >= bpRange.systolic.normal.min &&
    systolic <= bpRange.systolic.normal.max &&
    diastolic >= bpRange.diastolic.normal.min &&
    diastolic <= bpRange.diastolic.normal.max
  )
}