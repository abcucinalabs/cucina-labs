"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  BookOpen,
  FlaskConical,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  ChefHat,
} from "lucide-react"

type SavedContent = {
  id: string
  type: string
  title: string
  url?: string
  description?: string
  source?: string
  notes?: string
  used: boolean
  createdAt: string
}

const sourceOptions = [
  { value: "twitter", label: "Twitter/X" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "article", label: "Article" },
  { value: "newsletter", label: "Newsletter" },
  { value: "podcast", label: "Podcast" },
  { value: "youtube", label: "YouTube" },
  { value: "other", label: "Other" },
]

export default function SavePage() {
  const [savedItems, setSavedItems] = useState<SavedContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"recipe" | "cooking">("recipe")

  // Form state
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [source, setSource] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    loadSavedItems()
  }, [])

  const loadSavedItems = async () => {
    try {
      const res = await fetch("/api/saved-content")
      if (res.ok) {
        const data = await res.json()
        setSavedItems(data)
      }
    } catch (error) {
      console.error("Failed to load:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Title is required")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/saved-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: activeTab,
          title: title.trim(),
          url: url.trim() || null,
          description: description.trim() || null,
          source: source || null,
          notes: notes.trim() || null,
        }),
      })

      if (res.ok) {
        // Clear form
        setTitle("")
        setUrl("")
        setDescription("")
        setSource("")
        setNotes("")

        // Show success and reload
        setShowSuccess(true)
        setTimeout(() => setShowSuccess(false), 2000)
        loadSavedItems()
      } else {
        const error = await res.json()
        alert(`Failed to save: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to save:", error)
      alert("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return

    try {
      const res = await fetch(`/api/saved-content?id=${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        loadSavedItems()
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const recentItems = savedItems.slice(0, 10)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <ChefHat className="h-6 w-6 text-primary" />
          <h1 className="text-lg font-semibold">Save for Newsletter</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Success Toast */}
        {showSuccess && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
            <Check className="h-4 w-4" />
            Saved!
          </div>
        )}

        {/* Type Tabs */}
        <div className="flex gap-2">
          <button
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === "recipe"
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border"
            }`}
            onClick={() => setActiveTab("recipe")}
          >
            <BookOpen className="h-4 w-4" />
            Recipe
          </button>
          <button
            className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
              activeTab === "cooking"
                ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border"
            }`}
            onClick={() => setActiveTab("cooking")}
          >
            <FlaskConical className="h-4 w-4" />
            Cooking
          </button>
        </div>

        <p className="text-sm text-muted-foreground">
          {activeTab === "recipe"
            ? "Save posts, articles, or social content you enjoyed"
            : "Save experiments or projects to highlight"}
        </p>

        {/* Save Form */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border p-5 space-y-4 shadow-sm">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this about?"
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description or why you liked it..."
              rows={3}
              className="text-base"
            />
          </div>

          {activeTab === "recipe" && (
            <div className="space-y-2">
              <Label>Source</Label>
              <div className="flex flex-wrap gap-2">
                {sourceOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSource(source === opt.value ? "" : opt.value)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      source === opt.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Personal Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for yourself..."
              rows={2}
              className="text-base"
            />
          </div>

          <Button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="w-full h-12 text-base"
          >
            <Plus className="mr-2 h-5 w-5" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        {/* Recent Items */}
        {recentItems.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">
              Recently Saved
            </h2>
            <div className="space-y-2">
              {recentItems.map((item) => (
                <div
                  key={item.id}
                  className={`bg-white dark:bg-gray-900 rounded-xl border p-4 flex items-start gap-3 ${
                    item.used ? "opacity-60" : ""
                  }`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                      item.type === "recipe"
                        ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                        : "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                    }`}
                  >
                    {item.type === "recipe" ? (
                      <BookOpen className="h-4 w-4" />
                    ) : (
                      <FlaskConical className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm leading-tight">
                        {item.title}
                      </h3>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {item.source && (
                        <Badge variant="secondary" className="text-xs">
                          {item.source}
                        </Badge>
                      )}
                      {item.used && (
                        <Badge variant="outline" className="text-xs">
                          Used
                        </Badge>
                      )}
                    </div>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary mt-1"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {isLoading && (
          <p className="text-center text-sm text-muted-foreground py-4">
            Loading...
          </p>
        )}
      </main>
    </div>
  )
}
