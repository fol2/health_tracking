// User Profile Store - Manages user profile and preferences with persistence

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { UserProfileState, UserProfileActions, UserPreferences } from './types'

const API_BASE_URL = '/api/user'

interface UserProfileStore extends UserProfileState, UserProfileActions {}

const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: {
    fastStart: true,
    fastEnd: true,
    weightReminder: true,
    achievements: true,
  },
  privacy: {
    publicProfile: false,
    showProgress: false,
  },
  goals: {},
}

export const useUserProfileStore = create<UserProfileStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        profile: null,
        preferences: null,
        isLoading: false,
        error: null,

        // Actions
        setProfile: (profile) =>
          set((state) => {
            state.profile = profile
            state.error = null
          }),

        updateProfile: async (updates) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/profile`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates),
            })

            if (!response.ok) {
              throw new Error('Failed to update profile')
            }

            const updatedProfile = await response.json()
            
            set((state) => {
              state.profile = updatedProfile
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Update failed'
              state.isLoading = false
            })
            throw error
          }
        },

        setPreferences: (preferences) =>
          set((state) => {
            state.preferences = preferences
          }),

        updatePreferences: async (updates) => {
          const currentPreferences = get().preferences || defaultPreferences
          const newPreferences = { ...currentPreferences, ...updates }

          set((state) => {
            state.preferences = newPreferences
          })

          // Persist to backend
          try {
            await fetch(`${API_BASE_URL}/preferences`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(newPreferences),
            })
          } catch (error) {
            console.error('Failed to sync preferences:', error)
            // Don't throw - preferences are cached locally
          }
        },

        fetchProfile: async () => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/profile`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch profile')
            }

            const data = await response.json()
            
            set((state) => {
              state.profile = data.profile
              state.preferences = data.preferences || defaultPreferences
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Fetch failed'
              state.isLoading = false
            })
            throw error
          }
        },

        resetProfile: () =>
          set((state) => {
            state.profile = null
            state.preferences = null
            state.error = null
            state.isLoading = false
          }),
      })),
      {
        name: 'user-profile-store',
        partialize: (state) => ({
          preferences: state.preferences,
        }),
      }
    ),
    {
      name: 'user-profile-store',
    }
  )
)