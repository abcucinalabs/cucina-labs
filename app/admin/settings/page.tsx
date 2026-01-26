"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IntegrationsTab } from "@/components/tabs/integrations-tab"
import { UsersTab } from "@/components/tabs/users-tab"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Configure integrations and manage users
        </p>
      </div>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <IntegrationsTab />
        </TabsContent>

        <TabsContent value="users">
          <UsersTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
