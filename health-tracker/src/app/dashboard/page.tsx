import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FastingService } from "@/lib/services/fasting.service"
import { DashboardClient } from "./dashboard-client"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Fetch actual user data
  const [activeSession, stats] = await Promise.all([
    FastingService.getActiveSession(session.user.id!),
    FastingService.getUserStats(session.user.id!)
  ])

  const mockData = {
    currentFast: activeSession,
    totalFastingHours: stats.totalHours,
    currentStreak: stats.currentStreak,
    lastWeight: null,
    upcomingFast: null,
  }

  return <DashboardClient user={session.user} data={mockData} />
}