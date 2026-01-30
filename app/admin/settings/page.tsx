"use client"

import { UsersTab } from "@/components/tabs/users-tab"

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Settings</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Manage users and access
        </p>
      </div>

      <UsersTab />
    </div>
  )
}
