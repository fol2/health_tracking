// Fasting Session Store - Manages active fasting sessions and timer state

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { 
  FastingSessionState, 
  FastingSessionActions, 
  TimerState 
} from './types'

const API_BASE_URL = '/api/fasting'

interface FastingSessionStore extends FastingSessionState, FastingSessionActions {}

let timerInterval: NodeJS.Timeout | null = null

export const useFastingSessionStore = create<FastingSessionStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        activeSession: null,
        recentSessions: [],
        stats: null,
        isLoading: false,
        error: null,
        timerState: null,

        // Session management actions
        startSession: async (data) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/sessions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...data,
                startTime: new Date(),
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to start fasting session')
            }

            const session = await response.json()
            
            // Initialize timer state
            const startTime = new Date(session.startTime)
            const targetEndTime = new Date(startTime.getTime() + session.targetHours * 60 * 60 * 1000)
            
            set((state) => {
              state.activeSession = session
              state.timerState = {
                startTime,
                targetEndTime,
                elapsedSeconds: 0,
                remainingSeconds: session.targetHours * 60 * 60,
                isRunning: true,
                isPaused: false,
              }
              state.isLoading = false
            })

            // Start timer
            get().resumeTimer()
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Start failed'
              state.isLoading = false
            })
            throw error
          }
        },

        endSession: async () => {
          const activeSession = get().activeSession
          if (!activeSession) return

          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/sessions/${activeSession.id}/end`, {
              method: 'PATCH',
            })

            if (!response.ok) {
              throw new Error('Failed to end fasting session')
            }

            const endedSession = await response.json()
            
            set((state) => {
              state.activeSession = null
              state.timerState = null
              state.isLoading = false
              // Add to recent sessions
              state.recentSessions = [endedSession, ...state.recentSessions.slice(0, 9)]
            })

            // Stop timer
            get().resetTimer()

            // Refresh stats
            get().fetchStats()
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'End failed'
              state.isLoading = false
            })
            throw error
          }
        },

        cancelSession: async () => {
          const activeSession = get().activeSession
          if (!activeSession) return

          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/sessions/${activeSession.id}/cancel`, {
              method: 'PATCH',
            })

            if (!response.ok) {
              throw new Error('Failed to cancel fasting session')
            }

            set((state) => {
              state.activeSession = null
              state.timerState = null
              state.isLoading = false
            })

            // Stop timer
            get().resetTimer()
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Cancel failed'
              state.isLoading = false
            })
            throw error
          }
        },

        fetchActiveSession: async () => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/sessions/active`)
            
            if (response.ok) {
              const session = await response.json()
              
              if (session) {
                // Restore timer state
                const startTime = new Date(session.startTime)
                const now = new Date()
                const elapsedMs = now.getTime() - startTime.getTime()
                const elapsedSeconds = Math.floor(elapsedMs / 1000)
                const targetEndTime = new Date(startTime.getTime() + session.targetHours * 60 * 60 * 1000)
                const remainingSeconds = Math.max(0, Math.floor((targetEndTime.getTime() - now.getTime()) / 1000))
                
                set((state) => {
                  state.activeSession = session
                  state.timerState = {
                    startTime,
                    targetEndTime,
                    elapsedSeconds,
                    remainingSeconds,
                    isRunning: true,
                    isPaused: false,
                  }
                })

                // Resume timer
                get().resumeTimer()
              }
            }

            set((state) => {
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Fetch failed'
              state.isLoading = false
            })
          }
        },

        fetchRecentSessions: async (limit = 10) => {
          try {
            const response = await fetch(`${API_BASE_URL}/sessions?limit=${limit}`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch sessions')
            }

            const { sessions } = await response.json()
            
            set((state) => {
              state.recentSessions = sessions
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Fetch failed'
            })
          }
        },

        fetchStats: async () => {
          try {
            const response = await fetch(`${API_BASE_URL}/stats`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch stats')
            }

            const stats = await response.json()
            
            set((state) => {
              state.stats = stats
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Fetch failed'
            })
          }
        },

        // Timer management actions
        updateTimer: () => {
          const timerState = get().timerState
          if (!timerState || !timerState.isRunning || timerState.isPaused) return

          const now = new Date()
          const elapsedMs = now.getTime() - timerState.startTime.getTime()
          const elapsedSeconds = Math.floor(elapsedMs / 1000)
          const remainingSeconds = Math.max(0, Math.floor((timerState.targetEndTime.getTime() - now.getTime()) / 1000))

          set((state) => {
            if (state.timerState) {
              state.timerState.elapsedSeconds = elapsedSeconds
              state.timerState.remainingSeconds = remainingSeconds
            }
          })

          // Auto-end session if target time reached
          if (remainingSeconds === 0) {
            get().endSession()
          }
        },

        pauseTimer: () => {
          set((state) => {
            if (state.timerState) {
              state.timerState.isPaused = true
            }
          })

          if (timerInterval) {
            clearInterval(timerInterval)
            timerInterval = null
          }
        },

        resumeTimer: () => {
          set((state) => {
            if (state.timerState) {
              state.timerState.isPaused = false
            }
          })

          // Clear existing interval if any
          if (timerInterval) {
            clearInterval(timerInterval)
          }

          // Start new interval
          timerInterval = setInterval(() => {
            get().updateTimer()
          }, 1000)
        },

        resetTimer: () => {
          if (timerInterval) {
            clearInterval(timerInterval)
            timerInterval = null
          }

          set((state) => {
            state.timerState = null
          })
        },
      })),
      {
        name: 'fasting-session-store',
        partialize: (state) => ({
          timerState: state.timerState,
        }),
      }
    ),
    {
      name: 'fasting-session-store',
    }
  )
)