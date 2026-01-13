"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const days = [
  { value: "monday", label: "M" },
  { value: "tuesday", label: "T" },
  { value: "wednesday", label: "W" },
  { value: "thursday", label: "T" },
  { value: "friday", label: "F" },
  { value: "saturday", label: "S" },
  { value: "sunday", label: "S" },
]

interface DayBlocksProps {
  selectedDays: string[]
  className?: string
}

export function DayBlocks({ selectedDays, className }: DayBlocksProps) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {days.map((day, index) => (
        <div
          key={`${day.value}-${index}`}
          title={day.value.charAt(0).toUpperCase() + day.value.slice(1)}
          className={cn(
            "w-6 h-6 rounded flex items-center justify-center text-xs font-medium transition-colors",
            selectedDays.includes(day.value)
              ? "bg-[var(--accent-primary)] text-[color:var(--text-primary)]"
              : "bg-muted text-muted-foreground"
          )}
        >
          {day.label}
        </div>
      ))}
    </div>
  )
}
