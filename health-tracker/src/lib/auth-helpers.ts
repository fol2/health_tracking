import { auth } from "@/lib/auth"

// Helper function to get server session (replaces getServerSession)
export async function getServerSession() {
  const session = await auth()
  return session
}