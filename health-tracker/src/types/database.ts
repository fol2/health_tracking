// Database-specific types that match our Prisma schema

// Re-export Prisma types
export type {
  User,
  UserProfile,
  FastingSession,
  WeightRecord,
  HealthMetric,
  ScheduledFast,
  Reminder,
  Account,
  Session,
} from '@prisma/client'

// Custom types for our application

// Fasting types
export type FastingType = "16:8" | "18:6" | "20:4" | "24h" | "36h" | "48h" | "custom"
export type FastingStatus = "active" | "completed" | "cancelled"

// Units preference
export type UnitsPreference = "metric" | "imperial"

// Health metric types
export type HealthMetricType = 
  | "blood_pressure" 
  | "heart_rate" 
  | "blood_glucose" 
  | "body_temperature"
  | "oxygen_saturation"
  | "sleep_hours"
  | "water_intake"
  | "steps"
  | "calories_burned"

// Reminder types
export type ReminderType = "fast_start" | "fast_end" | "weight_check" | "custom"

// Structured data for specific health metrics
export interface BloodPressureValue {
  systolic: number
  diastolic: number
}

// Recurrence pattern for scheduled fasts
export interface RecurrencePattern {
  frequency: "daily" | "weekly" | "monthly"
  interval: number
  daysOfWeek?: number[] // 0-6, Sunday to Saturday
  endDate?: string // ISO date string
}

// Input types for creating/updating records
export interface CreateFastingSessionInput {
  startTime: Date
  type: FastingType | string
  targetHours: number
  status?: FastingStatus
  notes?: string
}

export interface UpdateFastingSessionInput {
  endTime?: Date
  status?: FastingStatus
  notes?: string
}

export interface CreateWeightRecordInput {
  weight: number
  recordedAt?: Date
  notes?: string
}

export interface CreateHealthMetricInput {
  metricType: HealthMetricType
  value: any // JSON value
  unit?: string
  recordedAt?: Date
  notes?: string
}

export interface CreateScheduledFastInput {
  scheduledStart: Date
  scheduledEnd: Date
  type: FastingType
  isRecurring?: boolean
  recurrencePattern?: RecurrencePattern
  reminderTime?: number // minutes before start
}

export interface CreateReminderInput {
  scheduledFastId?: string
  reminderTime: Date
  type: ReminderType
}