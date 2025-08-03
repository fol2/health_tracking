// Store Provider - Initializes stores with auth session

'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useUserProfileStore, useFastingSessionStore, useOfflineStore } from '@/store'

interface StoreProviderProps {
  children: React.ReactNode
}

export function StoreProvider({ children }: StoreProviderProps) {
  const { data: session, status } = useSession()
  const resetProfile = useUserProfileStore((state) => state.resetProfile)
  const resetTimer = useFastingSessionStore((state) => state.resetTimer)
  const setOnlineStatus = useOfflineStore((state) => state.setOnlineStatus)

  // Reset stores on logout
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      resetProfile()
      resetTimer()
    }
  }, [session, status, resetProfile, resetTimer])

  // Initialize online status monitoring
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true)
    const handleOffline = () => setOnlineStatus(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Set initial status
    setOnlineStatus(navigator.onLine)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [setOnlineStatus])

  // Periodic sync check for offline queue
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const { isOnline, queue, syncQueue } = useOfflineStore.getState()
      
      if (isOnline && queue.length > 0) {
        syncQueue()
      }
    }, 30000) // Check every 30 seconds

    return () => clearInterval(syncInterval)
  }, [])

  return <>{children}</>
}