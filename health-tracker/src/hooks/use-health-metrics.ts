// useHealthMetrics hook - Manages health metrics data

import { useEffect, useCallback } from 'react'
import { useHealthMetricsStore, useOfflineStore } from '@/store'
import { useAuth } from './use-auth'

export function useHealthMetrics() {
  const { isAuthenticated } = useAuth()
  const { isOnline, addToQueue } = useOfflineStore()
  const {
    recentWeight,
    weightHistory,
    metrics,
    isLoading,
    error,
    addWeightRecord,
    updateWeightRecord,
    deleteWeightRecord,
    fetchWeightHistory,
    addMetric,
    fetchMetrics,
    fetchAllMetrics,
  } = useHealthMetricsStore()

  // Fetch weight history on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchWeightHistory().catch(console.error)
    }
  }, [isAuthenticated, fetchWeightHistory])

  // Offline-aware add weight record
  const addWeightOffline = useCallback(
    async (weight: number, notes?: string) => {
      if (!isOnline) {
        const tempId = `temp-${Date.now()}`
        const record = {
          id: tempId,
          weight,
          notes,
          recordedAt: new Date(),
        }

        // Queue for later sync
        addToQueue({
          type: 'CREATE',
          resource: 'weight',
          data: record,
        })

        // Optimistically update UI
        useHealthMetricsStore.setState((state) => ({
          recentWeight: record as any,
          weightHistory: [record as any, ...state.weightHistory],
        }))

        return
      }

      return addWeightRecord(weight, notes)
    },
    [isOnline, addToQueue, addWeightRecord]
  )

  // Offline-aware add metric
  const addMetricOffline = useCallback(
    async (type: string, value: any, unit?: string, notes?: string) => {
      if (!isOnline) {
        const tempId = `temp-${Date.now()}`
        const metric = {
          id: tempId,
          metricType: type,
          value,
          unit,
          notes,
          recordedAt: new Date(),
        }

        // Queue for later sync
        addToQueue({
          type: 'CREATE',
          resource: 'metric',
          data: metric,
        })

        // Optimistically update UI
        useHealthMetricsStore.setState((state) => {
          if (!state.metrics[type]) {
            state.metrics[type] = []
          }
          state.metrics[type] = [metric as any, ...state.metrics[type]]
          return state
        })

        return
      }

      return addMetric(type, value, unit, notes)
    },
    [isOnline, addToQueue, addMetric]
  )

  // Get specific metric history
  const getMetricHistory = useCallback(
    (type: string) => {
      return metrics[type] || []
    },
    [metrics]
  )

  // Calculate weight change
  const weightChange = useCallback(() => {
    if (weightHistory.length < 2) return null
    
    const current = weightHistory[0].weight
    const previous = weightHistory[1].weight
    const change = current - previous
    const percentChange = (change / previous) * 100

    return {
      absolute: change,
      percent: percentChange,
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    }
  }, [weightHistory])

  return {
    // Weight data
    recentWeight,
    weightHistory,
    weightChange: weightChange(),
    
    // Metrics data
    metrics,
    getMetricHistory,
    
    // State
    isLoading,
    error,
    
    // Actions
    addWeight: addWeightOffline,
    updateWeight: updateWeightRecord,
    deleteWeight: deleteWeightRecord,
    addMetric: addMetricOffline,
    
    // Refetch functions
    refetchWeightHistory: fetchWeightHistory,
    refetchMetrics: fetchMetrics,
    refetchAllMetrics: fetchAllMetrics,
  }
}