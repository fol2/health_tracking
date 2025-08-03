"use client"

import { ReactNode } from "react"
import { Navbar } from "@/components/navigation/navbar"
import { BottomNav } from "@/components/navigation/bottom-nav"
import { cn } from "@/lib/utils"

interface DashboardLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  className?: string
}

export function DashboardLayout({ children, sidebar, className }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        {/* Sidebar for desktop */}
        {sidebar && (
          <aside className="hidden w-64 border-r bg-card md:block">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto p-4">
              {sidebar}
            </div>
          </aside>
        )}
        
        {/* Main content */}
        <main className={cn(
          "flex-1",
          "pb-16 md:pb-0", // Add padding for mobile bottom nav
          className
        )}>
          {children}
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <BottomNav />
    </div>
  )
}