"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"

export function SettingsTab() {
  const [welcomeEmailEnabled, setWelcomeEmailEnabled] = useState(false)
  const [welcomeEmailContent, setWelcomeEmailContent] = useState("")
  const [welcomeEmailSubject, setWelcomeEmailSubject] = useState("Welcome to cucina labs")
  const [isLoading, setIsLoading] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/email-templates/welcome")
      if (response.ok) {
        const data = await response.json()
        setWelcomeEmailEnabled(data.enabled)
        setWelcomeEmailContent(data.html || "")
        setWelcomeEmailSubject(data.subject || "Welcome to cucina labs")
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
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
          html: welcomeEmailContent,
          subject: welcomeEmailSubject,
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

  const handlePreview = () => {
    setShowPreview((current) => !current)
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
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="welcome-email">Enable Welcome Email</Label>
              <p className="text-sm text-muted-foreground">
                Send a welcome email when users subscribe
              </p>
            </div>
            <Switch
              id="welcome-email"
              checked={welcomeEmailEnabled}
              onCheckedChange={setWelcomeEmailEnabled}
            />
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
                <Label htmlFor="email-content">Email Content (HTML)</Label>
                <Textarea
                  id="email-content"
                  value={welcomeEmailContent}
                  onChange={(e) => setWelcomeEmailContent(e.target.value)}
                  rows={12}
                  placeholder="<html>...</html>"
                  className="font-mono text-sm"
                />
                <p className="text-sm text-muted-foreground">
                  Use HTML to format your welcome email. A CAN-SPAM compliant footer will be automatically added.
                </p>
              </div>
            </>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" onClick={handlePreview} type="button">
              {showPreview ? "Hide Preview" : "Preview"}
            </Button>
            <Button onClick={handleSave} disabled={isLoading} isLoading={isLoading}>
              Save Changes
            </Button>
          </div>

          {showPreview && (
            <div className="rounded-[var(--radius-xl)] border border-[var(--border-default)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)] overflow-hidden">
              {welcomeEmailContent.trim() ? (
                <iframe
                  title="Welcome email preview"
                  className="w-full min-h-[520px] border-0"
                  sandbox=""
                  srcDoc={welcomeEmailContent}
                />
              ) : (
                <div className="p-6 text-sm text-[color:var(--text-secondary)]">
                  No welcome email HTML to preview yet.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
