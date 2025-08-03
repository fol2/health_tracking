"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "@/components/theme-provider"
import { StoreProvider } from "@/components/store-provider"
import { Toaster } from "@/components/ui/sonner"
import { AutoStartMonitor } from "@/components/schedule/auto-start-monitor"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider defaultTheme="dark" storageKey="health-tracker-theme">
        <StoreProvider>
          {children}
          <AutoStartMonitor />
          <Toaster />
        </StoreProvider>
      </ThemeProvider>
    </SessionProvider>
  )
}