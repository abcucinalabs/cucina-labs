"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type TrendDirection = "up" | "down" | "neutral"

export function MetricCard({
  label,
  value,
  helper,
  trend,
  trendDirection,
  accent = "text-foreground",
}: {
  label: string
  value: string
  helper?: string
  trend?: string
  trendDirection?: TrendDirection
  accent?: string
}) {
  const getTrendColor = (direction?: TrendDirection) => {
    if (!direction || direction === "neutral") return "text-[color:var(--text-secondary)]"
    return direction === "up" ? "text-foreground" : "text-red-500/80"
  }

  const getTrendIcon = (direction?: TrendDirection) => {
    if (!direction || direction === "neutral") return null
    return direction === "up" ? "↑" : "↓"
  }

  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          {label}
        </p>
        <div className="mt-3 flex items-baseline gap-2">
          <p className={cn("text-2xl font-semibold", accent)}>{value}</p>
          {trend && (
            <span className={cn("text-sm font-medium", getTrendColor(trendDirection))}>
              {getTrendIcon(trendDirection)} {trend}
            </span>
          )}
        </div>
        {helper ? (
          <p className="mt-2 text-xs text-[color:var(--text-secondary)]">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
