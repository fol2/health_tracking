"use client"

import { cn } from "@/lib/utils"

interface BMIRangeProps {
  value: number
  className?: string
}

export function BMIRange({ value, className }: BMIRangeProps) {
  // BMI ranges
  const ranges = [
    { min: 0, max: 18.5, label: "Under", color: "bg-blue-400" },
    { min: 18.5, max: 25, label: "Normal", color: "bg-green-400" },
    { min: 25, max: 30, label: "Over", color: "bg-yellow-400" },
    { min: 30, max: 40, label: "Obese", color: "bg-red-400" },
  ]

  // Calculate position on the scale (0-40 BMI range)
  const position = Math.min(Math.max(value, 0), 40) / 40 * 100

  return (
    <div className={cn("w-full", className)}>
      {/* BMI value and indicator */}
      <div className="relative mb-2">
        <div 
          className="absolute -top-1 transform -translate-x-1/2 transition-all duration-300"
          style={{ left: `${position}%` }}
        >
          <div className="relative">
            <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900 dark:border-t-gray-100" />
          </div>
        </div>
      </div>

      {/* Range bar */}
      <div className="relative h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div className="absolute inset-0 flex">
          <div className="h-full bg-blue-400/60 dark:bg-blue-500/50" style={{ width: "18.5%" }} />
          <div className="h-full bg-green-400/60 dark:bg-green-500/50" style={{ width: "16.25%" }} />
          <div className="h-full bg-yellow-400/60 dark:bg-yellow-500/50" style={{ width: "12.5%" }} />
          <div className="h-full bg-red-400/60 dark:bg-red-500/50" style={{ width: "52.75%" }} />
        </div>
        
        {/* Position indicator */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-gray-900 dark:bg-gray-100 transition-all duration-300"
          style={{ left: `${position}%` }}
        />
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
      </div>
    </div>
  )
}