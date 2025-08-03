import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

interface ActionCardProps {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  actionLabel: string
  onAction?: () => void
  disabled?: boolean
  className?: string
}

export function ActionCard({
  title,
  description,
  icon: Icon,
  iconColor = "text-primary",
  actionLabel,
  onAction,
  disabled = false,
  className,
}: ActionCardProps) {
  return (
    <Card className={cn("transition-all hover:shadow-lg", className)}>
      <CardHeader>
        <div className="flex items-center space-x-3">
          {Icon && <Icon className={cn("h-8 w-8", iconColor)} />}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={onAction} 
          disabled={disabled}
          className="w-full"
          type="button"
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  )
}