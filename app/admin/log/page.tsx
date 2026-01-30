"use client"

import { LogTab } from "@/components/tabs/log-tab"

export default function LogPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Log</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          View email activity and system logs
        </p>
      </div>

      <LogTab />
    </div>
  )
}
