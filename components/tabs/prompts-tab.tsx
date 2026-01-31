"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RotateCcw, Save } from "lucide-react"

export function PromptsTab() {
  const [systemPrompt, setSystemPrompt] = useState("")
  const [userPrompt, setUserPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isDefault, setIsDefault] = useState(true)
  const [saveStatus, setSaveStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/sequence-prompts")
      if (response.ok) {
        const data = await response.json()
        setSystemPrompt(data.systemPrompt || "")
        setUserPrompt(data.userPrompt || "")
        setIsDefault(data.isDefault || false)
      }
    } catch (error) {
      console.error("Failed to fetch prompt config:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    setSaveStatus(null)
    try {
      const response = await fetch("/api/sequence-prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ systemPrompt, userPrompt }),
      })
      if (response.ok) {
        setIsDefault(false)
        setSaveStatus({ type: "success", message: "Prompts saved successfully." })
      } else {
        const data = await response.json()
        setSaveStatus({ type: "error", message: data.error || "Failed to save." })
      }
    } catch (error) {
      console.error("Failed to save prompts:", error)
      setSaveStatus({ type: "error", message: "Failed to save prompts." })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm("Reset prompts to defaults? This will overwrite your current prompts.")) return
    setIsResetting(true)
    setSaveStatus(null)
    try {
      const response = await fetch("/api/sequence-prompts/reset", {
        method: "POST",
      })
      if (response.ok) {
        await fetchConfig()
        setSaveStatus({ type: "success", message: "Prompts reset to defaults." })
      } else {
        setSaveStatus({ type: "error", message: "Failed to reset prompts." })
      }
    } catch (error) {
      console.error("Failed to reset prompts:", error)
      setSaveStatus({ type: "error", message: "Failed to reset prompts." })
    } finally {
      setIsResetting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Prompt Configuration</CardTitle>
          <CardDescription>
            Configure the system and user prompts used by all sequences to generate newsletter content. Individual sequences will use these prompts unless overridden.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              rows={12}
              className="font-mono text-xs resize-y"
              placeholder="System prompt for the AI model..."
            />
            <p className="text-[10px] text-muted-foreground">
              {systemPrompt.length} characters
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-prompt">User Prompt</Label>
            <Textarea
              id="user-prompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              rows={12}
              className="font-mono text-xs resize-y"
              placeholder="User prompt with template variables..."
            />
            <p className="text-[10px] text-muted-foreground">
              {userPrompt.length} characters
            </p>
          </div>

          <Card className="bg-[var(--bg-subtle)]">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Template Variables</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="font-mono bg-[var(--bg-surface)] px-2 py-1.5 rounded border border-[var(--border-default)]">
                  {"{{ $json.day_start }}"} <span className="text-muted-foreground ml-1">- Lookback start date</span>
                </div>
                <div className="font-mono bg-[var(--bg-surface)] px-2 py-1.5 rounded border border-[var(--border-default)]">
                  {"{{ $json.day_end }}"} <span className="text-muted-foreground ml-1">- Current date</span>
                </div>
                <div className="font-mono bg-[var(--bg-surface)] px-2 py-1.5 rounded border border-[var(--border-default)]">
                  {"{{ $json.total_articles }}"} <span className="text-muted-foreground ml-1">- Article count</span>
                </div>
                <div className="font-mono bg-[var(--bg-surface)] px-2 py-1.5 rounded border border-[var(--border-default)]">
                  {"{{ $json.articles }}"} <span className="text-muted-foreground ml-1">- Articles JSON</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {saveStatus && (
            <div className={`p-3 rounded-lg text-sm ${
              saveStatus.type === "success"
                ? "bg-[rgba(60,53,242,0.06)] text-[#3c35f2] border border-[rgba(60,53,242,0.2)]"
                : "bg-red-50 text-red-800 border border-red-200"
            }`}>
              {saveStatus.message}
            </div>
          )}

          <div className="flex items-center gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Prompts
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin mr-2" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
