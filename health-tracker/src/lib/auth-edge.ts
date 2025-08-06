import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import { getBaseAuthConfig, createGoogleProvider } from "./auth-shared"

// Edge-compatible auth config (no Prisma)
export const authConfig: NextAuthConfig = {
  ...getBaseAuthConfig(),
  providers: [createGoogleProvider()],
  // Use base callbacks as-is for edge runtime
  // (session callback already handles edge case by defaulting hasProfile to true)
}

export const { auth } = NextAuth(authConfig)