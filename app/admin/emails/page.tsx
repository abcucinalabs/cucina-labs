"use client"

import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SequencesTab } from "@/components/tabs/sequences-tab"
import { AdHocEmailTab } from "@/components/tabs/adhoc-email-tab"
import { Button } from "@/components/ui/button"
import { Settings } from "lucide-react"

export default function EmailsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Emails</h1>
          <p className="text-[color:var(--text-secondary)] mt-2">
            Create and send newsletters
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/settings">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="sequences" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="adhoc">Ad Hoc Email</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences">
          <SequencesTab />
        </TabsContent>

        <TabsContent value="adhoc">
          <AdHocEmailTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
