"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, EyeOff } from "lucide-react"

type Template = {
  id: string
  name: string
  description?: string | null
  html: string
}

export function SettingsTab() {
  const [welcomeEmailEnabled, setWelcomeEmailEnabled] = useState(false)
  const [welcomeEmailSubject, setWelcomeEmailSubject] = useState("Welcome to cucina labs")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSavingToggle, setIsSavingToggle] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchSettings()
    fetchTemplates()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/email-templates/welcome", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setWelcomeEmailEnabled(data.enabled)
        setWelcomeEmailSubject(data.subject || "Welcome to cucina labs")
        setSelectedTemplateId(data.templateId || null)
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/newsletter-templates", { cache: "no-store" })
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId)

  const handleToggleChange = async (enabled: boolean) => {
    setWelcomeEmailEnabled(enabled)
    setIsSavingToggle(true)
    try {
      await fetch("/api/email-templates/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          subject: welcomeEmailSubject,
          html: selectedTemplate?.html || "",
          templateId: selectedTemplateId,
        }),
      })
    } catch (error) {
      console.error("Failed to save toggle:", error)
      setWelcomeEmailEnabled(!enabled)
    } finally {
      setIsSavingToggle(false)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/email-templates/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled: welcomeEmailEnabled,
          subject: welcomeEmailSubject,
          html: selectedTemplate?.html || "",
          templateId: selectedTemplateId,
        }),
      })
      if (response.ok) {
        alert("Welcome email settings saved successfully!")
      } else {
        const error = await response.json()
        alert(`Failed to save: ${error.error || "Unknown error"}`)
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
      alert("Failed to save settings. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome Email</CardTitle>
          <CardDescription>
            Configure the welcome email sent to new subscribers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-0.5">
              <Label htmlFor="welcome-email">Enable Welcome Email</Label>
              <p className="text-sm text-muted-foreground">
                Send a welcome email when users subscribe
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isSavingToggle && (
                <span className="text-xs text-muted-foreground">Saving...</span>
              )}
              <Switch
                id="welcome-email"
                checked={welcomeEmailEnabled}
                onCheckedChange={handleToggleChange}
                disabled={isSavingToggle}
              />
            </div>
          </div>

          {welcomeEmailEnabled && (
            <>
              <div className="space-y-2">
                <Label htmlFor="email-subject">Email Subject</Label>
                <Input
                  id="email-subject"
                  value={welcomeEmailSubject}
                  onChange={(e) => setWelcomeEmailSubject(e.target.value)}
                  placeholder="Welcome to cucina labs"
                />
                <p className="text-sm text-muted-foreground">
                  The subject line for the welcome email
                </p>
              </div>

              <div className="space-y-2">
                <Label>Email Template</Label>
                <Select
                  value={selectedTemplateId || ""}
                  onValueChange={(value) => setSelectedTemplateId(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Choose a template from the Templates tab to use as the welcome email
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                {selectedTemplate && (
                  <Button
                    variant="outline"
                    onClick={() => setShowPreview(!showPreview)}
                    className="w-full sm:w-auto"
                  >
                    {showPreview ? (
                      <>
                        <EyeOff className="mr-2 h-4 w-4" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </>
                    )}
                  </Button>
                )}
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  isLoading={isLoading}
                  className="w-full sm:w-auto"
                >
                  Save Changes
                </Button>
              </div>

              {showPreview && selectedTemplate && (
                <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
                  <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-muted)] px-4 py-2">
                    <span className="text-sm font-medium">Email Preview</span>
                    <span className="text-xs text-muted-foreground">Subject: {welcomeEmailSubject}</span>
                  </div>
                  <iframe
                    title="Welcome email preview"
                    className="w-full min-h-[520px] border-0 md:min-h-[620px]"
                    sandbox=""
                    srcDoc={selectedTemplate.html}
                  />
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
