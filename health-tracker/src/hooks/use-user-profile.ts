// useUserProfile hook - Manages user profile data fetching and caching

import { useEffect } from 'react'
import { useUserProfileStore } from '@/store'
import { useAuth } from './use-auth'

export function useUserProfile() {
  const { user, isAuthenticated } = useAuth()
  const {
    profile,
    preferences,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    updatePreferences,
  } = useUserProfileStore()

  // Fetch profile when user is authenticated
  useEffect(() => {
    if (isAuthenticated && !profile && !isLoading) {
      fetchProfile().catch(console.error)
    }
  }, [isAuthenticated, profile, isLoading, fetchProfile])

  return {
    profile,
    preferences,
    isLoading,
    error,
    updateProfile,
    updatePreferences,
    refetch: fetchProfile,
  }
}