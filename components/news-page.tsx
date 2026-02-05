"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntegrationsTab } from "@/components/tabs/integrations-tab"
import { IngestionTab } from "@/components/tabs/ingestion-tab"
import { LogTab } from "@/components/tabs/log-tab"
import { SequencesTab } from "@/components/tabs/sequences-tab"
import { SettingsTab } from "@/components/tabs/settings-tab"
import { TemplatesTab } from "@/components/tabs/templates-tab"

export function NewsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">News</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Manage integrations, ingestion workflows, and newsletter sequences
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="ingestion">Ingestion</TabsTrigger>
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Subscription Settings</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="ingestion">
          <IngestionTab />
        </TabsContent>

        <TabsContent value="sequences">
          <SequencesTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="log">
          <LogTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
