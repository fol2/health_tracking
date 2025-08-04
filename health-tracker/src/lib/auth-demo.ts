import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import type { NextAuthConfig } from "next-auth"

// Demo user credentials for testing
const DEMO_USER = {
  email: "demo@healthtracker.test",
  name: "Demo User",
  password: "demo123"
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: "Demo Login",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        // Check if demo credentials
        if (credentials.email === DEMO_USER.email && credentials.password === DEMO_USER.password) {
          // Find or create demo user
          let user = await prisma.user.findUnique({
            where: { email: DEMO_USER.email }
          })
          
          if (!user) {
            user = await prisma.user.create({
              data: {
                email: DEMO_USER.email,
                name: DEMO_USER.name,
                image: "https://ui-avatars.com/api/?name=Demo+User&background=random"
              }
            })
          }
          
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image
          }
        }
        
        return null
      }
    })
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
        return false
      } else if (isLoggedIn) {
        return Response.redirect(new URL("/dashboard", nextUrl))
      }
      return true
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.sub!
        
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
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
export const authOptions = authConfig