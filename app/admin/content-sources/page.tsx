"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { IngestionTab } from "@/components/tabs/ingestion-tab"
import { DataSourceConfig } from "@/components/DataSourceConfig"

// Field definitions for each data source
const CHEFS_TABLE_FIELDS = [
  { id: "title", name: "Title", description: "The headline or title of the content" },
  { id: "author", name: "Author", description: "Who wrote or created the content" },
  { id: "content", name: "Content", description: "The main body text or description" },
  { id: "imageUrl", name: "Image URL", description: "Featured image for the content" },
  { id: "publishedAt", name: "Published Date", description: "When the content was published" },
]

const RECIPES_FIELDS = [
  { id: "name", name: "Recipe Name", description: "Name of the recipe" },
  { id: "description", name: "Description", description: "Brief description of the recipe" },
  { id: "ingredients", name: "Ingredients", description: "List of ingredients" },
  { id: "instructions", name: "Instructions", description: "Cooking instructions" },
  { id: "imageUrl", name: "Image URL", description: "Photo of the dish" },
  { id: "prepTime", name: "Prep Time", description: "Preparation time" },
  { id: "cookTime", name: "Cook Time", description: "Cooking time" },
]

const COOKING_FIELDS = [
  { id: "title", name: "Title", description: "What's being cooked" },
  { id: "description", name: "Description", description: "Details about the cooking project" },
  { id: "status", name: "Status", description: "Current status (planning, in progress, done)" },
  { id: "imageUrl", name: "Image URL", description: "Photo or preview image" },
]

export default function ContentSourcesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold text-foreground">Content Sources</h1>
        <p className="text-[color:var(--text-secondary)] mt-2">
          Manage content sources that feed into your newsletters
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
          <DataSourceConfig
            name="chefs_table"
            displayName="Chef's Table"
            description="Featured long-form content and articles from your Airtable base"
            requiredFields={CHEFS_TABLE_FIELDS}
          />
        </TabsContent>

        <TabsContent value="recipes">
          <DataSourceConfig
            name="recipes"
            displayName="Recipes"
            description="Recipe collection from your Airtable base"
            requiredFields={RECIPES_FIELDS}
          />
        </TabsContent>

        <TabsContent value="cooking">
          <DataSourceConfig
            name="cooking"
            displayName="What We're Cooking"
            description="Current cooking projects and experiments from your Airtable base"
            requiredFields={COOKING_FIELDS}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
