"use client"

export const dynamic = "force-dynamic"

import Link from "next/link"
import { IngestionTab } from "@/components/tabs/ingestion-tab"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function ContentSourcesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Content Sources</h1>
          <p className="text-[color:var(--text-secondary)] mt-2">
            Manage content sources that feed into your newsletters
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      <IngestionTab />
    </div>
  )
}
