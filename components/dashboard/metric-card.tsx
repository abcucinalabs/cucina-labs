"use client"

import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function MetricCard({
  label,
  value,
  helper,
  accent = "text-foreground",
}: {
  label: string
  value: string
  helper?: string
  accent?: string
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--text-muted)]">
          {label}
        </p>
        <p className={cn("mt-3 text-2xl font-semibold", accent)}>{value}</p>
        {helper ? (
          <p className="mt-2 text-xs text-[color:var(--text-secondary)]">{helper}</p>
        ) : null}
      </CardContent>
    </Card>
  )
}
