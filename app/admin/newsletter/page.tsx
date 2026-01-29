"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SequencesTab } from "@/components/tabs/sequences-tab"
import { TemplatesTab } from "@/components/tabs/templates-tab"
import { SettingsTab } from "@/components/tabs/settings-tab"
import { LogTab } from "@/components/tabs/log-tab"
import { DragDropBuilder } from "@/components/newsletter/DragDropBuilder"

export default function NewsletterPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Newsletter</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Manage newsletter sequences, templates, and subscription settings
        </p>
      </div>

      <Tabs defaultValue="sequences" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="sequences">Sequences</TabsTrigger>
          <TabsTrigger value="one-time">One-Time Email</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Subscription Settings</TabsTrigger>
          <TabsTrigger value="log">Log</TabsTrigger>
        </TabsList>

        <TabsContent value="sequences">
          <SequencesTab />
        </TabsContent>

        <TabsContent value="one-time">
          <DragDropBuilder />
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
