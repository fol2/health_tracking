"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { 
  Home, 
  Timer, 
  Utensils,
  Heart,
  BarChart3
} from "lucide-react"

const navigation = [
  { name: "Home", href: "/dashboard", icon: Home },
  { name: "Fast", href: "/fasting", icon: Timer },
  { name: "Meals", href: "/meals", icon: Utensils },
  { name: "Health", href: "/health", icon: Heart },
  { name: "Stats", href: "/analytics", icon: BarChart3 },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="grid h-16 grid-cols-5">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "animate-in zoom-in-50")} />
              <span>{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}