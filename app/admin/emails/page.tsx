"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SequencesTab } from "@/components/tabs/sequences-tab"
import { SettingsTab } from "@/components/tabs/settings-tab"
import { TemplatesTab } from "@/components/tabs/templates-tab"
import { AdHocEmailTab } from "@/components/tabs/adhoc-email-tab"
import { DragDropBuilder } from "@/components/newsletter/DragDropBuilder"

export default function EmailsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Emails</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Manage newsletters, templates, and welcome email settings
        </p>
      </div>

      <Tabs defaultValue="settings" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="settings">Welcome Email</TabsTrigger>
          <TabsTrigger value="adhoc">Ad Hoc Email</TabsTrigger>
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="builder">Email Builder</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="adhoc">
          <AdHocEmailTab />
        </TabsContent>

        <TabsContent value="newsletters">
          <SequencesTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="builder">
          <div className="relative">
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] rounded-lg">
              <div className="flex flex-col items-center text-center">
                <span className="inline-flex items-center rounded-full bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 shadow-sm">
                  Coming Soon
                </span>
              </div>
            </div>
            <div className="pointer-events-none select-none opacity-40 grayscale">
              <DragDropBuilder />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
