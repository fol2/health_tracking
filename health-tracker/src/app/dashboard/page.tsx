import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { FastingService } from "@/lib/services/fasting.service"
import { HealthService } from "@/lib/services/health.service"
import { UserService } from "@/lib/services/user.service"
import { ScheduleService } from "@/lib/services/schedule.service"
import { DashboardClient } from "./dashboard-client"
import { calculateBMI } from "@/lib/utils/health-calculations"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Fetch actual user data
  const [activeSession, stats, latestWeight, profile, upcomingFasts, weightHistory, recentActivities] = await Promise.all([
    FastingService.getActiveSession(session.user.id!),
    FastingService.getUserStats(session.user.id!),
    HealthService.getLatestWeight(session.user.id!),
    UserService.getOrCreateProfile(session.user.id!),
    ScheduleService.getUpcomingFasts(session.user.id!, 7),
    HealthService.getWeightHistory(session.user.id!, 30),
    HealthService.getRecentActivities(session.user.id!, 10)
  ])

  // Calculate BMI if we have both weight and height
  let bmi: number | null = null
  let previousBmi: number | null = null
  if (profile?.height) {
    if (latestWeight?.weight) {
      bmi = calculateBMI(latestWeight.weight, profile.height)
    }
    // Calculate previous BMI for trend
    if (weightHistory.length >= 2) {
      previousBmi = calculateBMI(weightHistory[1].weight, profile.height)
    }
  }

  // Calculate weight trend
  let weightTrend: number | null = null
  if (weightHistory.length >= 2) {
    const currentWeight = weightHistory[0].weight
    const previousWeight = weightHistory[1].weight
    weightTrend = currentWeight - previousWeight
  }

  // Get the next upcoming fast
  const upcomingFast = upcomingFasts.length > 0 ? upcomingFasts[0] : null

  // Format date on server to avoid hydration mismatch
  let lastWeightDateFormatted: string | null = null
  if (latestWeight?.recordedAt) {
    const date = new Date(latestWeight.recordedAt)
    const month = date.toLocaleDateString('en-US', { month: 'short' })
    const day = date.getDate()
    lastWeightDateFormatted = `${day} ${month}`
  }

  const dashboardData = {
    currentFast: activeSession,
    totalFastingHours: stats.totalHours,
    lastWeight: latestWeight?.weight || null,
    lastWeightDate: lastWeightDateFormatted,
    weightTrend,
    bmi,
    bmiTrend: bmi && previousBmi ? bmi - previousBmi : null,
    upcomingFast,
    recentActivities,
  }

  return <DashboardClient user={session.user} data={dashboardData} />
}