"use client"

import { IntegrationsTab } from "@/components/tabs/integrations-tab"

export default function IntegrationsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Integrations</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Configure external service connections
        </p>
      </div>

      <IntegrationsTab />
    </div>
  )
}
