import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import type { NextAuthConfig } from "next-auth"
import { getBaseAuthConfig, createGoogleProvider } from "./auth-shared"

// Demo mode for testing
const USE_DEMO_AUTH = process.env.USE_DEMO_AUTH === "true"

const DEMO_USER = {
  id: "demo-user-123",
  email: "demo@healthtracker.test",
  name: "Demo User",
  password: "demo123",
  image: "https://ui-avatars.com/api/?name=Demo+User&background=random"
}

const createDemoProvider = () => Credentials({
  name: "Demo Login",
  credentials: {
    email: { label: "Email", type: "email" },
    password: { label: "Password", type: "password" }
  },
  async authorize(credentials) {
    const isValidDemoUser = 
      credentials?.email === DEMO_USER.email && 
      credentials?.password === DEMO_USER.password
    
    return isValidDemoUser ? DEMO_USER : null
  }
})

const providers = USE_DEMO_AUTH 
  ? [createDemoProvider()] 
  : [createGoogleProvider()]

export const authConfig: NextAuthConfig = {
  ...getBaseAuthConfig(),
  // Don't use adapter with credentials provider
  adapter: USE_DEMO_AUTH ? undefined : PrismaAdapter(prisma),
  providers,
  callbacks: {
    ...getBaseAuthConfig().callbacks,
    session: async ({ session, token }) => {
      if (!session?.user || !token?.sub) return session
      
      session.user.id = token.sub
      
      // Skip database check for demo mode
      if (USE_DEMO_AUTH) {
        session.user.hasProfile = true
        return session
      }
      
      // Check if user has profile in database
      try {
        const profile = await prisma.userProfile.findUnique({
          where: { userId: token.sub }
        })
        session.user.hasProfile = !!profile
      } catch (error) {
        console.error("Error checking user profile:", error)
        session.user.hasProfile = false
      }
      
      return session
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export authOptions for backward compatibility
export const authOptions = authConfig