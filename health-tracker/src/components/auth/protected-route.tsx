"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
  requireProfile?: boolean
}

export function ProtectedRoute({ 
  children, 
  redirectTo = "/login",
  requireProfile = false 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push(redirectTo)
    } else if (requireProfile && !session.user?.hasProfile) {
      router.push("/profile/setup")
    }
  }, [session, status, router, redirectTo, requireProfile])

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="space-y-4">
          <Skeleton className="h-12 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}