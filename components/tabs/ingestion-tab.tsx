"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { DayPicker } from "@/components/ui/day-picker"
import { Plus, Trash2, Play, RotateCcw } from "lucide-react"

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
]

export function IngestionTab() {
  const [rssSources, setRssSources] = useState<any[]>([])
  const [config, setConfig] = useState({
    schedule: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    time: "09:00",
    timezone: "America/New_York",
    timeFrame: 72,
    systemPrompt: "",
    userPrompt: "",
  })
  const [newSource, setNewSource] = useState({ name: "", url: "", category: "" })
  const [openDialog, setOpenDialog] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isTesting, setIsTesting] = useState(false)

  useEffect(() => {
    fetchRssSources()
    fetchConfig()
  }, [])

  const fetchRssSources = async () => {
    try {
      const response = await fetch("/api/rss-sources")
      if (response.ok) {
        const data = await response.json()
        setRssSources(data)
      }
    } catch (error) {
      console.error("Failed to fetch RSS sources:", error)
    }
  }

  const fetchConfig = async () => {
    try {
      const response = await fetch("/api/ingestion/config")
      if (response.ok) {
        const data = await response.json()
        if (data) {
          setConfig({
            schedule: data.schedule || ["monday", "tuesday", "wednesday", "thursday", "friday"],
            time: data.time || "09:00",
            timezone: data.timezone || "America/New_York",
            timeFrame: data.timeFrame || 72,
            systemPrompt: data.systemPrompt || "",
            userPrompt: data.userPrompt || "",
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch config:", error)
    }
  }

  const handleAddSource = async () => {
    try {
      const response = await fetch("/api/rss-sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSource),
      })
      if (response.ok) {
        setNewSource({ name: "", url: "", category: "" })
        setOpenDialog(false)
        fetchRssSources()
      }
    } catch (error) {
      console.error("Failed to add RSS source:", error)
    }
  }

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await fetch(`/api/rss-sources/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      })
      fetchRssSources()
    } catch (error) {
      console.error("Failed to toggle RSS source:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this RSS source?")) return
    try {
      await fetch(`/api/rss-sources/${id}`, { method: "DELETE" })
      fetchRssSources()
    } catch (error) {
      console.error("Failed to delete RSS source:", error)
    }
  }

  const handleTestIngestion = async () => {
    setIsTesting(true)
    try {
      const response = await fetch("/api/ingestion/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ timeFrame: config.timeFrame }),
      })
      if (response.ok) {
        const data = await response.json()
        alert(`Test completed. Processed ${data.processed || 0}, selected ${data.selected || 0}, stored ${data.stored || 0}.`)
      }
    } catch (error) {
      console.error("Test ingestion failed:", error)
    } finally {
      setIsTesting(false)
    }
  }

  const handleSaveConfig = async () => {
    setIsLoading(true)
    try {
      await fetch("/api/ingestion/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })
      alert("Configuration saved!")
    } catch (error) {
      console.error("Failed to save config:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPrompts = async () => {
    if (!confirm("Reset prompts to default values? This will overwrite your current prompts.")) return
    try {
      const response = await fetch("/api/ingestion/config/reset", { method: "POST" })
      if (response.ok) {
        fetchConfig()
        alert("Prompts reset to defaults!")
      }
    } catch (error) {
      console.error("Failed to reset prompts:", error)
    }
  }

  // Parse time for display
  const [hours, minutes] = config.time.split(":")
  const hour12 = parseInt(hours) % 12 || 12
  const ampm = parseInt(hours) >= 12 ? "PM" : "AM"

  return (
    <div className="space-y-6">
      {/* RSS Sources Section */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>RSS Sources</CardTitle>
              <CardDescription>Manage your RSS feed sources for article ingestion</CardDescription>
            </div>
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Add RSS Source
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add RSS Source</DialogTitle>
                  <DialogDescription>
                    Add a new RSS feed to ingest articles from
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="source-name">Name</Label>
                    <Input
                      id="source-name"
                      value={newSource.name}
                      onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
                      placeholder="Source Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source-url">URL</Label>
                    <Input
                      id="source-url"
                      value={newSource.url}
                      onChange={(e) => setNewSource({ ...newSource, url: e.target.value })}
                      placeholder="https://example.com/feed.xml"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source-category">Category</Label>
                    <Select
                      value={newSource.category}
                      onValueChange={(value) => setNewSource({ ...newSource, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="AI News">AI News</SelectItem>
                        <SelectItem value="AI Product Strategy">AI Product Strategy</SelectItem>
                        <SelectItem value="AI Infrastructure">AI Infrastructure</SelectItem>
                        <SelectItem value="LLMs & Foundation Models">LLMs & Foundation Models</SelectItem>
                        <SelectItem value="Research">Research</SelectItem>
                        <SelectItem value="Tech News">Tech News</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddSource}>Add Source</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rssSources.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">
                      {source.name}
                      {source.isDefault && (
                        <Badge variant="outline" className="ml-2 text-xs">Default</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{source.category || "Uncategorized"}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">{source.url}</TableCell>
                    <TableCell>
                      <Switch
                        checked={source.enabled}
                        onCheckedChange={(checked) => handleToggle(source.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(source.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Configuration</CardTitle>
          <CardDescription>Configure when and how often to run ingestion</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Select Days</Label>
            <DayPicker
              value={config.schedule}
              onChange={(days) => setConfig({ ...config, schedule: days })}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Time</Label>
              <div className="flex flex-wrap gap-2">
                <Select
                  value={hour12.toString().padStart(2, "0")}
                  onValueChange={(h) => {
                    const newHour = ampm === "PM" && h !== "12" ? parseInt(h) + 12 : (ampm === "AM" && h === "12" ? 0 : parseInt(h))
                    setConfig({ ...config, time: `${newHour.toString().padStart(2, "0")}:${minutes}` })
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                      <SelectItem key={h} value={h.toString().padStart(2, "0")}>
                        {h.toString().padStart(2, "0")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span className="flex items-center text-muted-foreground">:</span>
                <Select
                  value={minutes}
                  onValueChange={(m) => setConfig({ ...config, time: `${hours}:${m}` })}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["00", "15", "30", "45"].map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={ampm}
                  onValueChange={(ap) => {
                    let newHour = parseInt(hours)
                    if (ap === "PM" && newHour < 12) newHour += 12
                    if (ap === "AM" && newHour >= 12) newHour -= 12
                    setConfig({ ...config, time: `${newHour.toString().padStart(2, "0")}:${minutes}` })
                  }}
                >
                  <SelectTrigger className="w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="PM">PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Timezone</Label>
              <Select
                value={config.timezone}
                onValueChange={(tz) => setConfig({ ...config, timezone: tz })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timezones.map((tz) => (
                    <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Frame</Label>
              <Select
                value={config.timeFrame.toString()}
                onValueChange={(v) => setConfig({ ...config, timeFrame: parseInt(v) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24">Last 24 hours</SelectItem>
                  <SelectItem value="48">Last 48 hours</SelectItem>
                  <SelectItem value="72">Last 72 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prompt Configuration */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>Prompt Configuration</CardTitle>
              <CardDescription>Configure AI prompts for article selection and curation</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetPrompts}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Default
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="system-prompt">System Prompt</Label>
            <Textarea
              id="system-prompt"
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder="You are an AI content curator..."
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {config.systemPrompt.length} characters
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-prompt">User Prompt</Label>
            <Textarea
              id="user-prompt"
              value={config.userPrompt}
              onChange={(e) => setConfig({ ...config, userPrompt: e.target.value })}
              placeholder="Select articles relevant to AI product builders..."
              rows={12}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              {config.userPrompt.length} characters • Use {"{{ variable }}"} for template variables
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test & Save */}
      <Card>
        <CardHeader>
          <CardTitle>Test & Save</CardTitle>
          <CardDescription>Test the ingestion workflow or save your configuration</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleTestIngestion} variant="outline" disabled={isTesting} isLoading={isTesting} className="w-full sm:w-auto">
            <Play className="mr-2 h-4 w-4" />
            Run Test Ingestion
          </Button>
          <Button onClick={handleSaveConfig} disabled={isLoading} isLoading={isLoading} className="w-full sm:w-auto">
            Save Configuration
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
