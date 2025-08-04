"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface DataCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  children: ReactNode
  action?: ReactNode
  className?: string
}

export function DataCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  children,
  action,
  className,
}: DataCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {Icon && <Icon className={cn("h-5 w-5", iconColor)} />}
            <div>
              <CardTitle>{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}