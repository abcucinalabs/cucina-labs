"use client"

import { IngestionTab } from "@/components/tabs/ingestion-tab"

export default function ContentSourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Content Sources</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Manage content sources that feed into your newsletters
        </p>
      </div>

      <IngestionTab />
    </div>
  )
}
