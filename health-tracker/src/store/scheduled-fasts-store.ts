// Scheduled Fasts Store - Manages scheduled and recurring fasts

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { ScheduledFastsState, ScheduledFastsActions } from './types'

const API_BASE_URL = '/api/scheduled'

interface ScheduledFastsStore extends ScheduledFastsState, ScheduledFastsActions {}

export const useScheduledFastsStore = create<ScheduledFastsStore>()(
  devtools(
    immer((set, get) => ({
      // Initial state
      scheduledFasts: [],
      upcomingFasts: [],
      isLoading: false,
      error: null,

      // Actions
      createScheduledFast: async (data) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await fetch(`${API_BASE_URL}/fasts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to create scheduled fast')
          }

          const scheduledFast = await response.json()
          
          set((state) => {
            state.scheduledFasts = [scheduledFast, ...(state.scheduledFasts || [])]
            state.isLoading = false
          })

          // Refresh upcoming fasts
          get().fetchUpcomingFasts()
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Create failed'
            state.isLoading = false
          })
          throw error
        }
      },

      updateScheduledFast: async (id, data) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await fetch(`${API_BASE_URL}/fasts/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            throw new Error('Failed to update scheduled fast')
          }

          const updatedFast = await response.json()
          
          set((state) => {
            if (state.scheduledFasts && Array.isArray(state.scheduledFasts)) {
              const index = state.scheduledFasts.findIndex(f => f.id === id)
              if (index !== -1) {
                state.scheduledFasts[index] = updatedFast
              }
            }
            state.isLoading = false
          })

          // Refresh upcoming fasts
          get().fetchUpcomingFasts()
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Update failed'
            state.isLoading = false
          })
          throw error
        }
      },

      deleteScheduledFast: async (id) => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await fetch(`${API_BASE_URL}/fasts/${id}`, {
            method: 'DELETE',
          })

          if (!response.ok) {
            throw new Error('Failed to delete scheduled fast')
          }

          set((state) => {
            state.scheduledFasts = (state.scheduledFasts || []).filter(f => f.id !== id)
            state.upcomingFasts = (state.upcomingFasts || []).filter(f => f.id !== id)
            state.isLoading = false
          })
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Delete failed'
            state.isLoading = false
          })
          throw error
        }
      },

      fetchScheduledFasts: async () => {
        set((state) => {
          state.isLoading = true
          state.error = null
        })

        try {
          const response = await fetch(`${API_BASE_URL}/fasts`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch scheduled fasts')
          }

          const fasts = await response.json()
          
          set((state) => {
            state.scheduledFasts = fasts
            state.isLoading = false
          })
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Fetch failed'
            state.isLoading = false
          })
        }
      },

      fetchUpcomingFasts: async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/fasts/upcoming`)
          
          if (!response.ok) {
            throw new Error('Failed to fetch upcoming fasts')
          }

          const fasts = await response.json()
          
          set((state) => {
            state.upcomingFasts = fasts
          })
        } catch (error) {
          set((state) => {
            state.error = error instanceof Error ? error.message : 'Fetch failed'
          })
        }
      },
    })),
    {
      name: 'scheduled-fasts-store',
    }
  )
)