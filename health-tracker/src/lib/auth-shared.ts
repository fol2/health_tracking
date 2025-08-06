import Google from "next-auth/providers/google"
import type { NextAuthConfig } from "next-auth"

// Shared constants
const SESSION_MAX_AGE = 30 * 24 * 60 * 60 // 30 days

// Shared Google provider configuration
export const createGoogleProvider = () => Google({
  clientId: process.env.GOOGLE_CLIENT_ID!.trim(),
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!.trim(),
  authorization: {
    params: {
      prompt: "consent",
      access_type: "offline",
      response_type: "code"
    }
  }
})

// Base auth configuration shared between edge and node runtime
export const getBaseAuthConfig = (): Partial<NextAuthConfig> => ({
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/error",
  },
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE,
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const isOnDashboard = nextUrl.pathname.startsWith("/dashboard")
      
      // Guard clause for dashboard access
      if (isOnDashboard && !isLoggedIn) {
        return false // Redirect to login
      }
      
      // Redirect logged-in users from public pages to dashboard
      if (isLoggedIn && !isOnDashboard) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      
      return true
    },
    jwt: async ({ user, token, account }) => {
      // Only set sub once when user first signs in
      if (user) {
        token.sub = user.id
      }
      
      // Store OAuth access token if available
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      
      return token
    },
    session: async ({ session, token }) => {
      // Edge-safe session callback (no database access)
      if (session?.user && token?.sub) {
        session.user.id = token.sub
        // Default to true, actual check happens in API routes or overridden in auth.ts
        session.user.hasProfile = true
      }
      return session
    },
  },
})