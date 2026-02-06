"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BookOpen,
  FlaskConical,
  Check,
  Plus,
  Trash2,
  ExternalLink,
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

export default function SavedContentAdminPage() {
  const [savedItems, setSavedItems] = useState<SavedContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState<"reading" | "cooking">("reading")

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
        setTitle("")
        setUrl("")
        setDescription("")
        setSource("")
        setNotes("")

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
        setSavedItems((prev) => prev.filter((item) => item.id !== id))
      }
    } catch (error) {
      console.error("Failed to delete:", error)
    }
  }

  const recentItems = savedItems.slice(0, 15)
  const filteredItems = recentItems.filter((item) => item.type === activeTab)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Content</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Add posts, articles, and projects to pull into the Weekly Newsletter.
        </CardContent>
      </Card>

      {showSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-top">
          <Check className="h-4 w-4" />
          Saved!
        </div>
      )}

      <div className="flex gap-2">
        <button
          className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            activeTab === "reading"
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border"
          }`}
          onClick={() => setActiveTab("reading")}
        >
          <BookOpen className="h-4 w-4" />
          Reading
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

      <Card>
        <CardHeader>
          <CardTitle>Add New</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What is this about?"
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <select
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select source</option>
              {sourceOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              rows={2}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving || !title.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent {activeTab === "reading" ? "Reading Items" : "Cooking Items"}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : filteredItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No items yet.</p>
          ) : (
            <div className="space-y-3">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      {item.source && (
                        <Badge variant="secondary" className="text-xs">
                          {item.source}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                      >
                        Open <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
