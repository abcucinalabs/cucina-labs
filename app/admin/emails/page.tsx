"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SequencesTab } from "@/components/tabs/sequences-tab"
import { AdHocEmailTab } from "@/components/tabs/adhoc-email-tab"
import { WeeklyNewsletterTab } from "@/components/tabs/weekly-newsletter-tab"

export default function EmailsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Emails</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Create and send newsletters
        </p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="weekly">Weekly Newsletter</TabsTrigger>
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
          <TabsTrigger value="adhoc">Ad Hoc Email</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly">
          <WeeklyNewsletterTab />
        </TabsContent>

        <TabsContent value="newsletters">
          <SequencesTab />
        </TabsContent>

        <TabsContent value="adhoc">
          <AdHocEmailTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
