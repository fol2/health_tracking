// Example: Offline Indicator Component using the offline store

'use client'

import { useOfflineStore } from '@/store'
import { Wifi, WifiOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function OfflineIndicatorExample() {
  const { isOnline, queue, syncing } = useOfflineStore()

  if (isOnline && queue.length === 0) {
    return null // Don't show anything when online with no pending actions
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg',
        isOnline ? 'bg-yellow-500' : 'bg-red-500',
        'text-white text-sm font-medium'
      )}
    >
      {isOnline ? (
        <>
          {syncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wifi className="h-4 w-4" />
          )}
          <span>
            {syncing
              ? 'Syncing...'
              : `${queue.length} changes pending sync`}
          </span>
        </>
      ) : (
        <>
          <WifiOff className="h-4 w-4" />
          <span>Offline - changes will sync when connected</span>
        </>
      )}
    </div>
  )
}