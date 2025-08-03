// useApi hook - Generic API hook with error handling and retry logic

import { useState, useCallback } from 'react'
import { useOfflineStore } from '@/store'

interface UseApiOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  retries?: number
  retryDelay?: number
}

export function useApi<T = any>(
  url: string,
  options?: UseApiOptions
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(false)
  const { isOnline } = useOfflineStore()

  const execute = useCallback(
    async (requestOptions?: RequestInit) => {
      if (!isOnline) {
        const offlineError = new Error('No internet connection')
        setError(offlineError)
        options?.onError?.(offlineError)
        throw offlineError
      }

      setLoading(true)
      setError(null)

      const maxRetries = options?.retries ?? 3
      const retryDelay = options?.retryDelay ?? 1000

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            ...requestOptions,
            headers: {
              'Content-Type': 'application/json',
              ...requestOptions?.headers,
            },
          })

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
          }

          const result = await response.json()
          setData(result)
          setLoading(false)
          options?.onSuccess?.(result)
          return result
        } catch (err) {
          if (attempt === maxRetries) {
            const error = err instanceof Error ? err : new Error('Unknown error')
            setError(error)
            setLoading(false)
            options?.onError?.(error)
            throw error
          }

          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)))
        }
      }
    },
    [url, isOnline, options]
  )

  const get = useCallback(() => execute({ method: 'GET' }), [execute])

  const post = useCallback(
    (data: any) =>
      execute({
        method: 'POST',
        body: JSON.stringify(data),
      }),
    [execute]
  )

  const patch = useCallback(
    (data: any) =>
      execute({
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    [execute]
  )

  const del = useCallback(() => execute({ method: 'DELETE' }), [execute])

  return {
    data,
    error,
    loading,
    get,
    post,
    patch,
    delete: del,
    execute,
  }
}