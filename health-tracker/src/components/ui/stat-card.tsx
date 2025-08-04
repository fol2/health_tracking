"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"
import { ReactNode } from "react"

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number | string
    label: string
    icon?: LucideIcon
    color?: string
  }
  customElement?: ReactNode
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  customElement,
  className,
}: StatCardProps) {
  const TrendIcon = trend?.icon

  return (
    <Card className={cn("transition-all hover:shadow-lg", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <CardDescription className="mt-1">{description}</CardDescription>
        )}
        {customElement && (
          <div className="mt-3">
            {customElement}
          </div>
        )}
        {trend && (
          <div className="mt-2 flex items-center gap-1 text-xs">
            {TrendIcon && (
              <TrendIcon 
                className={cn(
                  "h-3 w-3",
                  trend.color || "text-muted-foreground"
                )} 
              />
            )}
            <span className={cn("font-medium", trend.color)}>
              {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}