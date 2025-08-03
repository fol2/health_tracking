// Store utilities - Helper functions for state management

import { StateCreator, StoreMutatorIdentifier } from 'zustand'

// Helper to reset a store slice
export const resetters: (() => void)[] = []

export const resetAllStores = () => {
  resetters.forEach((reset) => reset())
}

// Immer + Persist + Devtools middleware type helper
export type StoreMiddlewares<T> = [
  ['zustand/immer', never],
  ['zustand/persist', Partial<T>],
  ['zustand/devtools', never]
]

// Helper to create a slice with automatic reset registration
export const createSlice = <T extends object>(
  initialState: T,
  createState: StateCreator<
    T,
    StoreMiddlewares<T>,
    [],
    T
  >
): StateCreator<T, StoreMiddlewares<T>, [], T> => {
  return (set, get, api) => {
    const slice = createState(set, get, api)
    const resetSlice = () => {
      set(initialState)
    }
    resetters.push(resetSlice)
    return slice
  }
}

// Storage version migration helper
export interface StorageValue<T> {
  state: T
  version: number
}

export const migrate = <T>(
  persistedState: any,
  version: number
): StorageValue<T> => {
  // Handle version migrations here
  // Example:
  // if (persistedState.version === 0) {
  //   // Migrate from v0 to v1
  // }
  
  return {
    state: persistedState.state,
    version,
  }
}

// Selective state persistence helper
export const persistPartialize = <T extends object>(
  keys: (keyof T)[]
) => (state: T): Partial<T> => {
  const partialState: Partial<T> = {}
  keys.forEach((key) => {
    partialState[key] = state[key]
  })
  return partialState
}

// Debounce helper for actions
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    timeoutId = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

// Storage helpers
export const storage = {
  getItem: (name: string): string | null => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  
  setItem: (name: string, value: string): void => {
    try {
      localStorage.setItem(name, value)
    } catch (error) {
      console.warn(`Failed to save ${name} to localStorage:`, error)
    }
  },
  
  removeItem: (name: string): void => {
    try {
      localStorage.removeItem(name)
    } catch {
      // Ignore errors
    }
  },
}

// Offline queue helpers
export const isTemporaryId = (id: string): boolean => {
  return id.startsWith('temp-')
}

export const generateTempId = (): string => {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Date formatting helpers
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours === 0) {
    return `${minutes}m`
  }
  
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

export const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  return [hours, minutes, secs]
    .map(val => val.toString().padStart(2, '0'))
    .join(':')
}

// Metric formatting helpers
export const formatWeight = (
  weight: number,
  unit: 'metric' | 'imperial' = 'metric'
): string => {
  if (unit === 'imperial') {
    return `${weight.toFixed(1)} lbs`
  }
  return `${weight.toFixed(1)} kg`
}

export const formatBloodPressure = (
  systolic: number,
  diastolic: number
): string => {
  return `${systolic}/${diastolic} mmHg`
}

export const formatBloodGlucose = (
  value: number,
  unit: 'mg/dL' | 'mmol/L' = 'mg/dL'
): string => {
  return `${value} ${unit}`
}