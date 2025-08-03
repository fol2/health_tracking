// useAutoSave hook - Auto-saves draft data with debouncing

import { useEffect, useRef, useCallback } from 'react'

interface UseAutoSaveOptions {
  delay?: number
  onSave: (data: any) => Promise<void> | void
  enabled?: boolean
}

export function useAutoSave<T>(
  data: T,
  options: UseAutoSaveOptions
) {
  const { delay = 1000, onSave, enabled = true } = options
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastSavedDataRef = useRef<string | undefined>(undefined)

  const save = useCallback(async () => {
    const serializedData = JSON.stringify(data)
    
    // Skip if data hasn't changed
    if (serializedData === lastSavedDataRef.current) {
      return
    }

    try {
      await onSave(data)
      lastSavedDataRef.current = serializedData
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
  }, [data, onSave])

  useEffect(() => {
    if (!enabled) return

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(save, delay)

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled, save])

  // Force save immediately
  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    save()
  }, [save])

  return { forceSave }
}