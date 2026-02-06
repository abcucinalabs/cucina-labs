"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

type Audience = {
  id: string
  name: string
}

export function AudiencesTab() {
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newName, setNewName] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    fetchAudiences()
  }, [])

  const fetchAudiences = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/resend/audiences", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setAudiences(data)
      }
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setIsCreating(true)
    try {
      const response = await fetch("/api/resend/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      })
      if (response.ok) {
        setNewName("")
        await fetchAudiences()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create audience.")
      }
    } catch (error) {
      console.error("Failed to create audience:", error)
      alert("Failed to create audience.")
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (audience: Audience) => {
    if (!confirm(`Delete audience "${audience.name}"? This cannot be undone.`)) return
    setDeletingId(audience.id)
    try {
      const response = await fetch(`/api/resend/audiences/${audience.id}`, {
        method: "DELETE",
      })
      if (response.ok) {
        await fetchAudiences()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete audience.")
      }
    } catch (error) {
      console.error("Failed to delete audience:", error)
      alert("Failed to delete audience.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resend Audiences</CardTitle>
          <CardDescription>
            Manage your Resend audiences. Audiences are used to segment subscribers for different email types.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex gap-2">
            <Input
              placeholder="New audience name..."
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
          ) : audiences.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No audiences found. Create one to get started.
            </div>
          ) : (
            <div className="space-y-2">
              {audiences.map((audience) => (
                <div
                  key={audience.id}
                  className="flex items-center justify-between rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">{audience.name}</p>
                    <p className="text-xs text-muted-foreground">{audience.id}</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(audience)}
                    disabled={deletingId === audience.id}
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
