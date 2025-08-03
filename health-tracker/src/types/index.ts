// User types
export interface User {
  id: string
  email: string
  name?: string
  image?: string
  createdAt: Date
  updatedAt: Date
}

// Health tracking types
export interface FastingSession {
  id: string
  userId: string
  startTime: Date
  endTime?: Date
  targetHours: number
  type: FastingType
  notes?: string
  completed: boolean
  createdAt: Date
  updatedAt: Date
}

export enum FastingType {
  INTERMITTENT_16_8 = "16:8",
  INTERMITTENT_18_6 = "18:6",
  INTERMITTENT_20_4 = "20:4",
  OMAD = "OMAD",
  EXTENDED_24H = "24H",
  EXTENDED_48H = "48H",
  EXTENDED_72H = "72H",
  CUSTOM = "CUSTOM",
}

export interface HealthMetric {
  id: string
  userId: string
  type: MetricType
  value: number
  unit: string
  recordedAt: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export enum MetricType {
  WEIGHT = "WEIGHT",
  BLOOD_PRESSURE_SYSTOLIC = "BLOOD_PRESSURE_SYSTOLIC",
  BLOOD_PRESSURE_DIASTOLIC = "BLOOD_PRESSURE_DIASTOLIC",
  HEART_RATE = "HEART_RATE",
  BLOOD_GLUCOSE = "BLOOD_GLUCOSE",
  BODY_TEMPERATURE = "BODY_TEMPERATURE",
  SLEEP_HOURS = "SLEEP_HOURS",
  WATER_INTAKE = "WATER_INTAKE",
  STEPS = "STEPS",
  CALORIES_BURNED = "CALORIES_BURNED",
}

// Dashboard types
export interface DashboardStats {
  totalFastingHours: number
  currentStreak: number
  longestStreak: number
  averageFastingDuration: number
  completionRate: number
  recentMetrics: HealthMetric[]
}