import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import type { NextAuthConfig } from "next-auth"

// Demo mode for testing
const USE_DEMO_AUTH = process.env.USE_DEMO_AUTH === "true"

const DEMO_USER = {
  email: "demo@healthtracker.test",
  name: "Demo User",
  password: "demo123"
}

const providers = USE_DEMO_AUTH ? [
  Credentials({
    name: "Demo Login",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" }
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null
      
      if (credentials.email === DEMO_USER.email && credentials.password === DEMO_USER.password) {
        // Return a static demo user
        return {
          id: "demo-user-123",
          email: DEMO_USER.email,
          name: DEMO_USER.name,
          image: "https://ui-avatars.com/api/?name=Demo+User&background=random"
        }
      }
      
      return null
    }
  })
] : [
  Google({
    clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code"
      }
    }
  }),
]

export const authConfig: NextAuthConfig = {
  // Don't use adapter with credentials provider
  adapter: USE_DEMO_AUTH ? undefined : PrismaAdapter(prisma),
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/error",
  },
  session: {
    strategy: "jwt",
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      if (isOnDashboard) {
        if (isLoggedIn) return true
        return false // Redirect unauthenticated users to login page
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!
        
        // For demo mode, always has profile
        if (USE_DEMO_AUTH) {
          session.user.hasProfile = true
        } else {
          // Check if user has profile
          const profile = await prisma.userProfile.findUnique({
            where: { userId: token.sub! }
          })
          session.user.hasProfile = !!profile
        }
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
        token.sub = user.id
      }
      return token
    },
  },
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export authOptions for backward compatibility
export const authOptions = authConfig