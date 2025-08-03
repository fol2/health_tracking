// Offline Store - Manages offline state and queued actions

import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { OfflineState, OfflineActions, QueuedAction } from './types'

interface OfflineStore extends OfflineState, OfflineActions {}

export const useOfflineStore = create<OfflineStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial state
        isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
        queue: [],
        syncing: false,
        lastSyncTime: null,

        // Actions
        setOnlineStatus: (online) => {
          set((state) => {
            state.isOnline = online
          })

          // Auto-sync when coming back online
          if (online && get().queue.length > 0) {
            get().syncQueue()
          }
        },

        addToQueue: (action) => {
          const queuedAction: QueuedAction = {
            ...action,
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            retries: 0,
          }

          set((state) => {
            state.queue.push(queuedAction)
          })
        },

        removeFromQueue: (id) => {
          set((state) => {
            state.queue = state.queue.filter(action => action.id !== id)
          })
        },

        syncQueue: async () => {
          const { queue, isOnline } = get()
          
          if (!isOnline || queue.length === 0 || get().syncing) {
            return
          }

          set((state) => {
            state.syncing = true
          })

          const failedActions: QueuedAction[] = []

          for (const action of queue) {
            try {
              // Execute the queued action based on type and resource
              await executeQueuedAction(action)
              
              // Remove successfully processed action
              get().removeFromQueue(action.id)
            } catch (error) {
              console.error('Failed to sync action:', action, error)
              
              // Increment retry count
              const updatedAction = { ...action, retries: action.retries + 1 }
              
              // Keep action in queue if retries < 3
              if (updatedAction.retries < 3) {
                failedActions.push(updatedAction)
              }
            }
          }

          set((state) => {
            state.queue = failedActions
            state.syncing = false
            state.lastSyncTime = new Date()
          })
        },

        clearQueue: () => {
          set((state) => {
            state.queue = []
          })
        },
      })),
      {
        name: 'offline-store',
        partialize: (state) => ({
          queue: state.queue,
          lastSyncTime: state.lastSyncTime,
        }),
      }
    ),
    {
      name: 'offline-store',
    }
  )
)

// Helper function to execute queued actions
async function executeQueuedAction(action: QueuedAction): Promise<void> {
  const { type, resource, data } = action

  switch (resource) {
    case 'session':
      return executeSessionAction(type, data)
    case 'weight':
      return executeWeightAction(type, data)
    case 'metric':
      return executeMetricAction(type, data)
    case 'profile':
      return executeProfileAction(type, data)
    case 'scheduled':
      return executeScheduledAction(type, data)
    default:
      throw new Error(`Unknown resource type: ${resource}`)
  }
}

async function executeSessionAction(type: string, data: any): Promise<void> {
  const endpoint = '/api/fasting/sessions'
  
  switch (type) {
    case 'CREATE':
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
    case 'UPDATE':
      await fetch(`${endpoint}/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
    case 'DELETE':
      await fetch(`${endpoint}/${data.id}`, {
        method: 'DELETE',
      })
      break
  }
}

async function executeWeightAction(type: string, data: any): Promise<void> {
  const endpoint = '/api/health/weight'
  
  switch (type) {
    case 'CREATE':
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
    case 'UPDATE':
      await fetch(`${endpoint}/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
    case 'DELETE':
      await fetch(`${endpoint}/${data.id}`, {
        method: 'DELETE',
      })
      break
  }
}

async function executeMetricAction(type: string, data: any): Promise<void> {
  const endpoint = '/api/health/metrics'
  
  switch (type) {
    case 'CREATE':
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
  }
}

async function executeProfileAction(type: string, data: any): Promise<void> {
  const endpoint = '/api/user/profile'
  
  switch (type) {
    case 'UPDATE':
      await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
  }
}

async function executeScheduledAction(type: string, data: any): Promise<void> {
  const endpoint = '/api/scheduled/fasts'
  
  switch (type) {
    case 'CREATE':
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
    case 'UPDATE':
      await fetch(`${endpoint}/${data.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      break
    case 'DELETE':
      await fetch(`${endpoint}/${data.id}`, {
        method: 'DELETE',
      })
      break
  }
}

// Initialize online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useOfflineStore.getState().setOnlineStatus(true)
  })

  window.addEventListener('offline', () => {
    useOfflineStore.getState().setOnlineStatus(false)
  })
}