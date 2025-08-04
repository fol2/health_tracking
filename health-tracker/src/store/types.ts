// Store types for Zustand state management

import type {
  User,
  UserProfile,
  FastingSession,
  WeightRecord,
  HealthMetric,
  ScheduledFast,
  Reminder,
} from '@/types/database'

// UI Store Types
export interface UIState {
  isLoading: boolean
  globalError: string | null
  activeModal: string | null
  sidebarOpen: boolean
  bottomNavVisible: boolean
}

export interface UIActions {
  setLoading: (loading: boolean) => void
  setGlobalError: (error: string | null) => void
  openModal: (modalId: string) => void
  closeModal: () => void
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setBottomNavVisible: (visible: boolean) => void
}

// User Profile Store Types
export interface UserProfileState {
  profile: UserProfile | null
  preferences: UserPreferences | null
  isLoading: boolean
  error: string | null
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  notifications: {
    fastStart: boolean
    fastEnd: boolean
    weightReminder: boolean
    achievements: boolean
  }
  privacy: {
    publicProfile: boolean
    showProgress: boolean
  }
  goals: {
    targetWeight?: number
    weeklyFastingHours?: number
    dailyWaterIntake?: number
  }
}

export interface UserProfileActions {
  setProfile: (profile: UserProfile) => void
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
  setPreferences: (preferences: UserPreferences) => void
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
  fetchProfile: () => Promise<void>
  resetProfile: () => void
}

// Fasting Session Store Types
export interface FastingSessionState {
  activeSession: FastingSession | null
  recentSessions: FastingSession[]
  stats: FastingStats | null
  isLoading: boolean
  error: string | null
  // Timer state
  timerState: TimerState | null
}

export interface TimerState {
  startTime: Date
  targetEndTime: Date
  elapsedSeconds: number
  remainingSeconds: number
  isRunning: boolean
  isPaused: boolean
}

export interface FastingStats {
  totalSessions: number
  totalHours: number
  averageHours: number
  longestFast: number
  currentStreak: number
  longestStreak: number
  completionRate: number
}

export interface FastingSessionActions {
  // Session management
  startSession: (data: { type: string; targetHours: number; notes?: string; startTime?: Date }) => Promise<void>
  endSession: () => Promise<void>
  cancelSession: () => Promise<void>
  fetchActiveSession: () => Promise<void>
  fetchRecentSessions: (limit?: number) => Promise<void>
  fetchStats: () => Promise<void>
  
  // Timer management
  updateTimer: () => void
  pauseTimer: () => void
  resumeTimer: () => void
  resetTimer: () => void
}

// Health Metrics Store Types
export interface HealthMetricsState {
  recentWeight: WeightRecord | null
  weightHistory: WeightRecord[]
  metrics: Record<string, HealthMetric[]>
  isLoading: boolean
  error: string | null
}

export interface HealthMetricsActions {
  // Weight management
  addWeightRecord: (weight: number, notes?: string) => Promise<void>
  updateWeightRecord: (id: string, weight: number, notes?: string) => Promise<void>
  deleteWeightRecord: (id: string) => Promise<void>
  fetchWeightHistory: (limit?: number) => Promise<void>
  
  // General metrics
  addMetric: (type: string, value: any, unit?: string, notes?: string) => Promise<void>
  fetchMetrics: (type: string, limit?: number) => Promise<void>
  fetchAllMetrics: () => Promise<void>
}

// Scheduled Fasts Store Types
export interface ScheduledFastsState {
  scheduledFasts: ScheduledFast[]
  upcomingFasts: ScheduledFast[]
  isLoading: boolean
  error: string | null
}

export interface ScheduledFastsActions {
  createScheduledFast: (data: any) => Promise<void>
  updateScheduledFast: (id: string, data: any) => Promise<void>
  deleteScheduledFast: (id: string) => Promise<void>
  fetchScheduledFasts: () => Promise<void>
  fetchUpcomingFasts: () => Promise<void>
}

// Offline Queue Types
export interface QueuedAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  resource: 'session' | 'weight' | 'metric' | 'profile' | 'scheduled'
  data: any
  timestamp: Date
  retries: number
}

export interface OfflineState {
  isOnline: boolean
  queue: QueuedAction[]
  syncing: boolean
  lastSyncTime: Date | null
}

export interface OfflineActions {
  setOnlineStatus: (online: boolean) => void
  addToQueue: (action: Omit<QueuedAction, 'id' | 'timestamp' | 'retries'>) => void
  removeFromQueue: (id: string) => void
  syncQueue: () => Promise<void>
  clearQueue: () => void
}

// Combined Store Type
export interface RootStore {
  ui: UIState & UIActions
  userProfile: UserProfileState & UserProfileActions
  fastingSessions: FastingSessionState & FastingSessionActions
  healthMetrics: HealthMetricsState & HealthMetricsActions
  scheduledFasts: ScheduledFastsState & ScheduledFastsActions
  offline: OfflineState & OfflineActions
}