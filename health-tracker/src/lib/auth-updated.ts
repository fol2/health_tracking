import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import type { NextAuthConfig } from "next-auth"

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/error",
  },
  session: {
    strategy: "jwt",
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
        
        // Check if user has profile
        const profile = await prisma.userProfile.findUnique({
          where: { userId: token.sub! }
        })
        session.user.hasProfile = !!profile
      }
      return session
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === "development", // 添加調試模式
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

// Export authOptions for backward compatibility
export const authOptions = authConfig