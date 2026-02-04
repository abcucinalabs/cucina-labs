"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

type Topic = {
  id: string
  name: string
}

export function TopicsTab() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchTopics()
  }, [])

  const fetchTopics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/resend/topics")
      if (response.ok) {
        const data = await response.json()
        setTopics(data)
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      const response = await fetch("/api/resend/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (response.ok) {
        setNewName("")
        await fetchTopics()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create topic.")
      }
    } catch (error) {
      console.error("Failed to create topic:", error)
      alert("Failed to create topic.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (topic: Topic) => {
    if (!confirm(`Delete topic "${topic.name}"? This cannot be undone.`)) return
    setDeletingId(topic.id)
    try {
      const response = await fetch(`/api/resend/topics/${topic.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        await fetchTopics()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete topic.")
      }
    } catch (error) {
      console.error("Failed to delete topic:", error)
      alert("Failed to delete topic.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resend Topics</CardTitle>
          <CardDescription>
            Manage your Resend topics. Topics allow subscribers to choose their email preferences (e.g., Daily Digest, Weekly News).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="New topic name..."
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            <Button onClick={handleCreate} disabled={isCreating || !newName.trim()}>
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No topics found. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((topic) => (
                <div
                  key={topic.id}
                  className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{topic.name}</p>
                    <p className="text-xs text-muted-foreground">{topic.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(topic)}
                    disabled={deletingId === topic.id}
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
