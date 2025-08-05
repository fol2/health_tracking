// Health Metrics Store - Manages weight records and health metrics

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { HealthMetricsState, HealthMetricsActions } from './types'

const API_BASE_URL = '/api/health'

interface HealthMetricsStore extends HealthMetricsState, HealthMetricsActions {}

export const useHealthMetricsStore = create<HealthMetricsStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        recentWeight: null,
        weightHistory: [],
        metrics: {},
        isLoading: false,
        error: null,

        // Weight management actions
        addWeightRecord: async (weight, notes, recordedAt) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/weight`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                weight,
                notes,
                recordedAt: recordedAt || new Date(),
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to add weight record')
            }

            const record = await response.json()
            
            set((state) => {
              state.recentWeight = record
              state.weightHistory = [record, ...state.weightHistory]
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Add failed'
              state.isLoading = false
            })
            throw error
          }
        },

        updateWeightRecord: async (id, weight, notes, recordedAt) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/weight/${id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ weight, notes, recordedAt }),
            })

            if (!response.ok) {
              throw new Error('Failed to update weight record')
            }

            const updatedRecord = await response.json()
            
            set((state) => {
              const index = state.weightHistory.findIndex(r => r.id === id)
              if (index !== -1) {
                state.weightHistory[index] = updatedRecord
              }
              if (state.recentWeight?.id === id) {
                state.recentWeight = updatedRecord
              }
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

        deleteWeightRecord: async (id) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/weight/${id}`, {
              method: 'DELETE',
            })

            if (!response.ok) {
              throw new Error('Failed to delete weight record')
            }

            set((state) => {
              state.weightHistory = state.weightHistory.filter(r => r.id !== id)
              if (state.recentWeight?.id === id) {
                state.recentWeight = state.weightHistory[0] || null
              }
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

        fetchWeightHistory: async (limit = 30) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/weight?limit=${limit}`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch weight history')
            }

            const { records } = await response.json()
            
            set((state) => {
              state.weightHistory = records
              state.recentWeight = records[0] || null
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Fetch failed'
              state.isLoading = false
            })
          }
        },

        // General metrics actions
        addMetric: async (type, value, unit, notes, recordedAt) => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/metrics`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                metricType: type,
                value,
                unit,
                notes,
                recordedAt: recordedAt || new Date(),
              }),
            })

            if (!response.ok) {
              throw new Error('Failed to add metric')
            }

            const metric = await response.json()
            
            set((state) => {
              if (!state.metrics[type]) {
                state.metrics[type] = []
              }
              state.metrics[type] = [metric, ...state.metrics[type]]
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Add failed'
              state.isLoading = false
            })
            throw error
          }
        },

        fetchMetrics: async (type, limit = 30) => {
          try {
            const response = await fetch(`${API_BASE_URL}/metrics/${type}?limit=${limit}`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch metrics')
            }

            const { metrics } = await response.json()
            
            set((state) => {
              state.metrics[type] = metrics
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Fetch failed'
            })
          }
        },

        fetchAllMetrics: async () => {
          set((state) => {
            state.isLoading = true
            state.error = null
          })

          try {
            const response = await fetch(`${API_BASE_URL}/metrics`)
            
            if (!response.ok) {
              throw new Error('Failed to fetch all metrics')
            }

            const { metricsByType } = await response.json()
            
            set((state) => {
              state.metrics = metricsByType
              state.isLoading = false
            })
          } catch (error) {
            set((state) => {
              state.error = error instanceof Error ? error.message : 'Fetch failed'
              state.isLoading = false
            })
          }
        },
      })),
      {
        name: 'health-metrics-store',
        partialize: (state) => ({
          recentWeight: state.recentWeight,
        }),
      }
    ),
    {
      name: 'health-metrics-store',
    }
  )
)