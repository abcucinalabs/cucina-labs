"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngestionTab } from "@/components/tabs/ingestion-tab"

export default function DataPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Data</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Manage data sources that feed into your newsletters
        </p>
      </div>

      <Tabs defaultValue="news" className="space-y-6">
        <TabsList className="w-full flex-wrap gap-2 overflow-x-auto sm:flex-nowrap sm:gap-1">
          <TabsTrigger value="news">News</TabsTrigger>
          <TabsTrigger value="chefs-table">Chef&apos;s Table</TabsTrigger>
          <TabsTrigger value="recipes">Recipes</TabsTrigger>
          <TabsTrigger value="cooking">What We&apos;re Cooking</TabsTrigger>
        </TabsList>

        <TabsContent value="news">
          <IngestionTab />
        </TabsContent>

        <TabsContent value="chefs-table">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
            <p className="text-[color:var(--text-secondary)]">
              Chef&apos;s Table data source configuration coming soon...
            </p>
          </div>
        </TabsContent>

        <TabsContent value="recipes">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
            <p className="text-[color:var(--text-secondary)]">
              Recipes data source configuration coming soon...
            </p>
          </div>
        </TabsContent>

        <TabsContent value="cooking">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-8 text-center">
            <p className="text-[color:var(--text-secondary)]">
              What We&apos;re Cooking data source configuration coming soon...
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
