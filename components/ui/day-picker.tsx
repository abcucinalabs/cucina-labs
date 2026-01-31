"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

const days = [
  { value: "monday", label: "Mon" },
  { value: "tuesday", label: "Tue" },
  { value: "wednesday", label: "Wed" },
  { value: "thursday", label: "Thu" },
  { value: "friday", label: "Fri" },
  { value: "saturday", label: "Sat" },
  { value: "sunday", label: "Sun" },
]

interface DayPickerProps {
  value: string[]
  onChange: (days: string[]) => void
  className?: string
}

export function DayPicker({ value, onChange, className }: DayPickerProps) {
  const toggleDay = (day: string) => {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day))
    } else {
      onChange([...value, day])
    }
  }

  const selectAll = () => {
    onChange(days.map((d) => d.value))
  }

  const clearAll = () => {
    onChange([])
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        {days.map((day) => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            className={cn(
              "relative w-[60px] h-10 rounded-[var(--radius-md)] border font-medium text-sm transition-all duration-200",
              value.includes(day.value)
                ? "bg-[var(--accent-primary)] border-[var(--accent-primary)] text-white"
                : "bg-[var(--bg-subtle)] border-[var(--border-default)] text-muted-foreground hover:border-[var(--border-hover)]"
            )}
          >
            {day.label}
            {value.includes(day.value) && (
              <Check className="absolute -top-1 -right-1 h-4 w-4 bg-[var(--accent-primary-dark)] rounded-full p-0.5 text-white" />
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={selectAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Select All
        </button>
        <span className="text-muted-foreground">|</span>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear All
        </button>
      </div>
    </div>
  )
}
