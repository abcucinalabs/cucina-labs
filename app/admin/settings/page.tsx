"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntegrationsTab } from "@/components/tabs/integrations-tab"
import { TemplatesTab } from "@/components/tabs/templates-tab"
import { SettingsTab } from "@/components/tabs/settings-tab"
import { UsersTab } from "@/components/tabs/users-tab"
import { LogTab } from "@/components/tabs/log-tab"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Configure integrations, templates, and team access
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="welcome">Welcome Email</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="log">Activity Log</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="templates">
          <TemplatesTab />
        </TabsContent>

        <TabsContent value="welcome">
          <SettingsTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>

        <TabsContent value="log">
          <LogTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
