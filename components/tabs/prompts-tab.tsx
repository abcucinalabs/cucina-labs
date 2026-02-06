"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { RotateCcw, Save } from "lucide-react"

type PromptKey = "ingestion" | "daily_insights" | "weekly_update"

type PromptResponse = {
  key: PromptKey
  label: string
  description: string
  prompt: string
  isDefault: boolean
  variables: string[]
}

const promptOptions: { key: PromptKey; label: string }[] = [
  { key: "ingestion", label: "Ingestion Prompt" },
  { key: "daily_insights", label: "Daily Insights Prompt" },
  { key: "weekly_update", label: "Weekly Update Prompt" },
]

export function PromptsTab() {
  const [selectedKey, setSelectedKey] = useState<PromptKey>("ingestion")
  const [promptData, setPromptData] = useState<PromptResponse | null>(null)
  const [promptText, setPromptText] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchPrompt(selectedKey)
  }, [selectedKey])

  const fetchPrompt = async (key: PromptKey) => {
    setIsLoading(true)
    setSaveStatus(null)
    try {
      const response = await fetch(`/api/prompts?key=${key}`, { cache: "no-store" })
      if (!response.ok) throw new Error("Failed to load prompt")
      const data: PromptResponse = await response.json()
      setPromptData(data)
      setPromptText(data.prompt || "")
    } catch (error) {
      console.error("Failed to fetch prompt:", error)
      setSaveStatus({ type: "error", message: "Failed to load prompt." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      const response = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selectedKey, prompt: promptText }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setSaveStatus({ type: "error", message: data?.error || "Failed to save prompt." })
        return
      }

      await fetchPrompt(selectedKey)
      setSaveStatus({ type: "success", message: "Prompt saved successfully." })
    } catch (error) {
      console.error("Failed to save prompt:", error)
      setSaveStatus({ type: "error", message: "Failed to save prompt." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Restore this prompt to its default version? This will overwrite your current edits.")) return
    setIsResetting(true)
    setSaveStatus(null)
    try {
      const response = await fetch("/api/prompts/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: selectedKey }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        setSaveStatus({ type: "error", message: data?.error || "Failed to restore default prompt." })
        return
      }

      await fetchPrompt(selectedKey)
      setSaveStatus({ type: "success", message: "Default prompt restored." })
    } catch (error) {
      console.error("Failed to reset prompt:", error)
      setSaveStatus({ type: "error", message: "Failed to restore default prompt." })
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const variables = promptData?.variables || []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Prompt Configuration</CardTitle>
          <CardDescription>
            Manage the three critical prompts used for ingestion, daily insights generation, and weekly updates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt-type">Prompt Type</Label>
            <Select value={selectedKey} onValueChange={(value) => setSelectedKey(value as PromptKey)}>
              <SelectTrigger id="prompt-type" className="max-w-md">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {promptOptions.map((opt) => (
                  <SelectItem key={opt.key} value={opt.key}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {promptData?.description && (
              <p className="text-xs text-muted-foreground">{promptData.description}</p>
            )}
            {promptData?.isDefault ? (
              <Badge variant="outline">Using default prompt</Badge>
            ) : (
              <Badge variant="secondary">Customized</Badge>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt-text">Prompt</Label>
            <Textarea
              id="prompt-text"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              rows={20}
              className="resize-y font-mono text-xs"
              placeholder="Prompt text..."
            />
            <p className="text-[10px] text-muted-foreground">{promptText.length} characters</p>
          </div>

          <Card className="bg-[var(--bg-subtle)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Detected JSON Variables</CardTitle>
            </CardHeader>
            <CardContent>
              {variables.length === 0 ? (
                <p className="text-xs text-muted-foreground">No template variables detected in this prompt.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {variables.map((variable) => (
                    <div
                      key={variable}
                      className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-1.5 font-mono text-xs"
                    >
                      {variable}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {saveStatus && (
            <div
              className={`rounded-lg border p-3 text-sm ${
                saveStatus.type === "success"
                  ? "border-[rgba(60,53,242,0.2)] bg-[rgba(60,53,242,0.06)] text-[#3c35f2]"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {saveStatus.message}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Prompt
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={isResetting}>
              {isResetting ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              ) : (
                <RotateCcw className="mr-2 h-4 w-4" />
              )}
              Restore Default
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
