"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface UseAuthOptions {
  redirectTo?: string
  redirectIfFound?: boolean
}

export function useAuth(options?: UseAuthOptions) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { redirectTo = "/login", redirectIfFound = false } = options || {}

  useEffect(() => {
    // If session is still loading, don't do anything
    if (status === "loading") return

    // If no session and not redirectIfFound, redirect to login
    if (!session && !redirectIfFound) {
      router.push(redirectTo)
    }

    // If session exists and redirectIfFound is true, redirect to dashboard
    if (session && redirectIfFound) {
      router.push("/dashboard")
    }
  }, [session, status, redirectTo, redirectIfFound, router])

  return {
    user: session?.user,
    isLoading: status === "loading",
    isAuthenticated: !!session,
  }
}