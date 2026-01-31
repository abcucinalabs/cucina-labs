"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DayPicker } from "@/components/ui/day-picker"
import { AlertCircle, Plus, ExternalLink } from "lucide-react"
import {
  DEFAULT_NEWSLETTER_TEMPLATE,
  buildNewsletterTemplateContext,
  renderNewsletterTemplate,
} from "@/lib/newsletter-template"
import { computeScheduleRules } from "@/lib/schedule-rules"

const timezones = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "UTC", label: "UTC" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Paris", label: "Paris (CET/CEST)" },
]

export function SequenceWizard({
  open,
  onClose,
  sequence,
}: {
  open: boolean
  onClose: () => void
  sequence?: any
}) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: "",
    audienceId: "",
    topicId: "",
    contentSources: [] as string[],
    dayOfWeek: [] as string[],
    time: "09:00",
    timezone: "America/New_York",
    templateId: "",
  })
  const [audiences, setAudiences] = useState<any[]>([])
  const [topics, setTopics] = useState<any[]>([])
  const [testEmail, setTestEmail] = useState("")
  const [testApproved, setTestApproved] = useState(false)
  const [preview, setPreview] = useState("")
  const [previewError, setPreviewError] = useState("")
  const [customHtml, setCustomHtml] = useState("")
  const [customHtmlOpen, setCustomHtmlOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{ content: any; articles: any[] } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmailStatus, setTestEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const systemDefaultValue = "system-default"
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [saveAsDefault, setSaveAsDefault] = useState(false)
  const [isSendingNow, setIsSendingNow] = useState(false)
  const [sendNowStatus, setSendNowStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showCreateAudience, setShowCreateAudience] = useState(false)
  const [newAudienceName, setNewAudienceName] = useState("")
  const [isCreatingAudience, setIsCreatingAudience] = useState(false)
  const normalizeAudienceId = (audienceId?: string) =>
    audienceId === "local_all" ? "resend_all" : audienceId || ""

  useEffect(() => {
    if (open) {
      fetchAudiences()
      fetchTopics()
      fetchTemplates()
      if (sequence) {
        // Load existing sequence data
        setFormData({
          name: sequence.name || "",
          audienceId: normalizeAudienceId(sequence.audienceId),
          topicId: sequence.topicId || "",
          contentSources: sequence.contentSources || [],
          dayOfWeek: sequence.dayOfWeek || [],
          time: sequence.time || "09:00",
          timezone: sequence.timezone || "America/New_York",
          templateId: sequence.templateId || "",
        })
        setSelectedTemplateId(sequence.templateId || "")

        // Load template HTML if sequence has a templateId
        if (sequence.templateId) {
          loadTemplateHtml(sequence.templateId)
        } else {
          // If no templateId, use default template
          setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
        }
      } else {
        // New sequence: use default template
        setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
      }
      setPreviewData(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sequence])

  const fetchAudiences = async () => {
    try {
      const response = await fetch("/api/resend/audiences")
      if (response.ok) {
        const data = await response.json()
        setAudiences(data)
      }
    } catch (error) {
      console.error("Failed to fetch audiences:", error)
    }
  }

  const fetchTopics = async () => {
    try {
      const response = await fetch("/api/resend/topics")
      if (response.ok) {
        const data = await response.json()
        setTopics(data)
      }
    } catch (error) {
      console.error("Failed to fetch topics:", error)
    }
  }

  const handleCreateAudience = async () => {
    if (!newAudienceName.trim()) return
    setIsCreatingAudience(true)
    try {
      const response = await fetch("/api/resend/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newAudienceName.trim() }),
      })
      if (response.ok) {
        const created = await response.json()
        await fetchAudiences()
        setFormData(prev => ({ ...prev, audienceId: created.id }))
        setNewAudienceName("")
        setShowCreateAudience(false)
      }
    } catch (error) {
      console.error("Failed to create audience:", error)
    } finally {
      setIsCreatingAudience(false)
    }
  }

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/newsletter-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
        const defaultTemplate = data.find((template: any) => template.isDefault)
        if (!selectedTemplateId) {
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id)
            setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }))
            setCustomHtml(defaultTemplate.html || DEFAULT_NEWSLETTER_TEMPLATE)
          } else if (!sequence) {
            setSelectedTemplateId(systemDefaultValue)
            setFormData(prev => ({ ...prev, templateId: "" }))
            setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
          }
        }
        if (sequence && !sequence.templateId && !selectedTemplateId) {
          if (defaultTemplate) {
            setSelectedTemplateId(defaultTemplate.id)
            setFormData(prev => ({ ...prev, templateId: defaultTemplate.id }))
            setCustomHtml(defaultTemplate.html || DEFAULT_NEWSLETTER_TEMPLATE)
          } else {
            setSelectedTemplateId(systemDefaultValue)
            setFormData(prev => ({ ...prev, templateId: "" }))
            setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const loadTemplateHtml = async (templateId: string) => {
    try {
      const response = await fetch(`/api/newsletter-templates/${templateId}`)
      if (response.ok) {
        const template = await response.json()
        setCustomHtml(template.html || DEFAULT_NEWSLETTER_TEMPLATE)
      } else {
        console.error("Failed to load template, using default")
        setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
      }
    } catch (error) {
      console.error("Failed to load template:", error)
      setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !customHtml.trim()) {
      alert("Please enter a template name and HTML content")
      return
    }

    try {
      console.log("Saving template:", { name: newTemplateName, htmlLength: customHtml.length, isDefault: saveAsDefault })

      const response = await fetch("/api/newsletter-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          html: customHtml,
          isDefault: saveAsDefault
        })
      })

      const data = await response.json()
      console.log("Save template response:", { ok: response.ok, status: response.status, data })

      if (response.ok) {
        // Refresh the templates list to get updated isDefault flags
        await fetchTemplates()
        setSelectedTemplateId(data.id)
        setSaveTemplateDialogOpen(false)
        setNewTemplateName("")
        setSaveAsDefault(false)
        alert("Template saved successfully!")
      } else {
        const errorMsg = data.details || data.error || "Unknown error"
        console.error("Failed to save template - Server error:", errorMsg)
        alert(`Failed to save template: ${errorMsg}`)
      }
    } catch (error) {
      console.error("Failed to save template - Client error:", error)
      alert(`Failed to save template: ${error instanceof Error ? error.message : "Network error - please check your connection"}`)
    }
  }

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setCustomHtml(template.html)
      setSelectedTemplateId(templateId)
      setFormData({ ...formData, templateId })
    }
  }

  const handleNext = () => {
    if (step < 6) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleGeneratePreview = async () => {
    setIsLoadingPreview(true)
    setPreviewError("")
    setPreview("")

    try {
      const response = await fetch("/api/sequences/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayOfWeek: formData.dayOfWeek,
          htmlTemplate: customHtml,
        }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        if (data.html?.includes("No recent articles") || data.html?.includes("No articles")) {
          setPreviewError("No articles have been ingested yet. Run the ingestion workflow first to populate articles, then try generating a preview again.")
        } else if (data.error) {
          setPreviewError(data.error + (data.details ? `: ${data.details}` : ""))
        } else {
          const hasPreviewData = Boolean(data.content && data.articles)
          if (hasPreviewData) {
            setPreviewData({ content: data.content, articles: data.articles })
          }

          const shouldAutoApplyTemplate = !sequence && customHtml.trim() && hasPreviewData

          if (shouldAutoApplyTemplate) {
            try {
              const context = buildNewsletterTemplateContext({
                content: data.content,
                articles: data.articles,
                origin: typeof window !== "undefined" ? window.location.origin : "",
              })
              const html = renderNewsletterTemplate(customHtml, context)
              setPreview(html)
            } catch (error) {
              console.error("Failed to auto-render default HTML:", error)
              setPreview(data.html)
              setPreviewError("Failed to render the default HTML template. Check the template syntax.")
            }
          } else {
            setPreview(data.html)
          }
        }
      } else {
        setPreviewError(data.error || "Failed to generate preview")
      }
    } catch (error) {
      console.error("Failed to generate preview:", error)
      setPreviewError("Failed to generate preview. Please try again.")
    } finally {
      setIsLoadingPreview(false)
    }
  }

  const handleOpenCustomHtml = () => {
    if (!customHtml) {
      setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
    }
    setCustomHtmlOpen(true)
  }

  const handleApplyCustomHtml = () => {
    if (!customHtml.trim()) return
    if (!previewData) {
      setPreviewError("Generate a preview first to load newsletter data.")
      return
    }

    try {
      const context = buildNewsletterTemplateContext({
        content: previewData.content,
        articles: previewData.articles,
        origin: typeof window !== "undefined" ? window.location.origin : "",
      })
      const html = renderNewsletterTemplate(customHtml, context)
      setPreview(html)
      setPreviewError("")
      setCustomHtmlOpen(false)
    } catch (error) {
      console.error("Failed to render custom HTML:", error)
      setPreviewError("Failed to render custom HTML. Check the template syntax.")
    }
  }

  const handleSendTest = async () => {
    setIsSendingTest(true)
    setTestEmailStatus(null)
    
    try {
      const response = await fetch("/api/sequences/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ testEmail, customHtml }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        setTestEmailStatus({ type: "success", message: "Test email sent successfully! Check your inbox." })
      } else {
        setTestEmailStatus({ type: "error", message: data.error || "Failed to send test email" })
      }
    } catch (error) {
      console.error("Failed to send test:", error)
      setTestEmailStatus({ type: "error", message: "Failed to send test email. Please try again." })
    } finally {
      setIsSendingTest(false)
    }
  }

  const handlePublish = async () => {
    try {
      const url = sequence ? `/api/sequences/${sequence.id}` : "/api/sequences"
      const method = sequence ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "active" }),
      })
      if (response.ok) {
        onClose()
      }
    } catch (error) {
      console.error("Failed to publish sequence:", error)
    }
  }

  const handleSendNow = async () => {
    if (!sequence?.id) {
      setSendNowStatus({ type: "error", message: "Please save the sequence first" })
      return
    }

    setIsSendingNow(true)
    setSendNowStatus(null)

    try {
      const response = await fetch(`/api/sequences/${sequence.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      })

      const data = await response.json()

      if (response.ok) {
        setSendNowStatus({ type: "success", message: data.message || "Newsletter sent successfully to all subscribers!" })
      } else {
        setSendNowStatus({ type: "error", message: data.error || "Failed to send newsletter" })
      }
    } catch (error) {
      console.error("Failed to send newsletter:", error)
      setSendNowStatus({ type: "error", message: "Failed to send newsletter. Please try again." })
    } finally {
      setIsSendingNow(false)
    }
  }

  const handleSaveDraft = async () => {
    try {
      const url = sequence ? `/api/sequences/${sequence.id}` : "/api/sequences"
      const method = sequence ? "PUT" : "POST"
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, status: "draft" }),
      })
      if (response.ok) {
        onClose()
      }
    } catch (error) {
      console.error("Failed to save draft sequence:", error)
    }
  }

  // Parse time for display
  const [hours, minutes] = formData.time.split(":")
  const hour12 = parseInt(hours) % 12 || 12
  const ampm = parseInt(hours) >= 12 ? "PM" : "AM"
  const canSave = Boolean(formData.name && formData.audienceId)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sequence ? "Edit Sequence" : "Create New Sequence"} - Step {step} of 6
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Basic information about your sequence"}
            {step === 2 && "When should this sequence run?"}
            {step === 3 && "Review content rules for this sequence"}
            {step === 4 && "Preview the generated newsletter"}
            {step === 5 && "Send a test email to verify"}
            {step === 6 && "Review and publish your sequence"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 min-h-[320px]">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Daily Digest"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="audience">Resend Audience</Label>
                <Select
                  value={formData.audienceId}
                  onValueChange={(value) => setFormData({ ...formData, audienceId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an audience" />
                  </SelectTrigger>
                  <SelectContent>
                    {audiences.map((audience) => (
                      <SelectItem key={audience.id} value={audience.id}>
                        {audience.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!showCreateAudience && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCreateAudience(true)}
                    className="mt-1.5"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Create new audience
                  </Button>
                )}
                {showCreateAudience && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={newAudienceName}
                      onChange={(e) => setNewAudienceName(e.target.value)}
                      placeholder="Audience name"
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCreateAudience()
                        if (e.key === "Escape") {
                          setShowCreateAudience(false)
                          setNewAudienceName("")
                        }
                      }}
                      autoFocus
                    />
                    <Button
                      size="sm"
                      onClick={handleCreateAudience}
                      disabled={!newAudienceName.trim() || isCreatingAudience}
                      isLoading={isCreatingAudience}
                    >
                      Create
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowCreateAudience(false)
                        setNewAudienceName("")
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Audiences are fetched from your Resend account
                </p>
              </div>
              <div className="space-y-1.5">
                <Label>Content Sources</Label>
                <div className="space-y-2">
                  {[
                    { value: "news", label: "News", description: "AI-curated news articles" },
                    { value: "chefs_table", label: "Chef's Table", description: "Editorial intro section" },
                    { value: "recipes", label: "Recipes", description: "Saved social posts & articles" },
                    { value: "cooking", label: "What We're Cooking", description: "Experiments & projects" },
                  ].map((source) => (
                    <label key={source.value} className="flex items-start gap-2 cursor-pointer">
                      <Checkbox
                        checked={formData.contentSources.includes(source.value)}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            contentSources: checked
                              ? [...prev.contentSources, source.value]
                              : prev.contentSources.filter(s => s !== source.value),
                          }))
                        }}
                      />
                      <div>
                        <span className="text-sm font-medium">{source.label}</span>
                        <p className="text-xs text-muted-foreground">{source.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Select which content types to include in this sequence
                </p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="topic">Resend Topic</Label>
                <Select
                  value={formData.topicId}
                  onValueChange={(value) => setFormData({ ...formData, topicId: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a topic (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No topic</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Topics allow subscribers to manage their email preferences
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-700">
                Sequences are checked hourly. Newsletter sends at the next matching hour.
              </div>
              <div className="space-y-1.5">
                <Label>Select Days</Label>
                <DayPicker
                  value={formData.dayOfWeek}
                  onChange={(days) => setFormData({ ...formData, dayOfWeek: days })}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Time</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={hour12.toString().padStart(2, "0")}
                    onValueChange={(h) => {
                      const newHour = ampm === "PM" && h !== "12" ? parseInt(h) + 12 : (ampm === "AM" && h === "12" ? 0 : parseInt(h))
                      setFormData({ ...formData, time: `${newHour.toString().padStart(2, "0")}:00` })
                    }}
                  >
                    <SelectTrigger className="w-[72px]">
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
                  <span className="text-muted-foreground">:</span>
                  <Select value="00" disabled>
                    <SelectTrigger className="w-[72px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="00">00</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={ampm}
                    onValueChange={(ap) => {
                      let newHour = parseInt(hours)
                      if (ap === "PM" && newHour < 12) newHour += 12
                      if (ap === "AM" && newHour >= 12) newHour -= 12
                      setFormData({ ...formData, time: `${newHour.toString().padStart(2, "0")}:00` })
                    }}
                  >
                    <SelectTrigger className="w-[72px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">AM</SelectItem>
                      <SelectItem value="PM">PM</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Timezone</Label>
                <Select
                  value={formData.timezone}
                  onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Content Rules */}
          {step === 3 && (() => {
            const rules = computeScheduleRules(formData.dayOfWeek)
            return (
              <div className="space-y-3">
                <Label className="text-sm font-medium">Content Rules</Label>
                <Card>
                  <CardContent className="pt-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Schedule Pattern</span>
                      <span className="font-medium capitalize">{rules.schedulePattern}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Article Lookback</span>
                      <span className="font-medium">{rules.timeFrameLabel}</span>
                    </div>
                    <div className="border-t border-[var(--border-default)] pt-3">
                      <p className="text-xs text-muted-foreground">{rules.dayExplanation}</p>
                    </div>
                    {formData.contentSources.length > 0 && (
                      <div className="border-t border-[var(--border-default)] pt-3">
                        <span className="text-muted-foreground text-xs">Content Sources: </span>
                        <span className="text-xs font-medium">
                          {formData.contentSources.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace("_", " ")).join(", ")}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="p-2.5 rounded-md bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 flex items-center justify-between">
                  <span>AI prompts are managed globally in Settings.</span>
                  <a href="/admin/settings" className="inline-flex items-center gap-1 text-[#3c35f2] hover:underline">
                    Edit Prompts <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )
          })()}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={handleGeneratePreview} disabled={isLoadingPreview} isLoading={isLoadingPreview}>
                  Generate Preview
                </Button>
                <Button size="sm" variant="outline" onClick={handleOpenCustomHtml}>
                  Customize HTML
                </Button>
              </div>

              {/* Template Management */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="template-select" className="text-xs">Template</Label>
                  <Select
                    value={selectedTemplateId || systemDefaultValue}
                    onValueChange={(value) => {
                      if (value === systemDefaultValue) {
                        setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
                        setSelectedTemplateId(systemDefaultValue)
                        setFormData({ ...formData, templateId: "" })
                      } else {
                        handleLoadTemplate(value)
                      }
                    }}
                  >
                    <SelectTrigger id="template-select">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.length === 0 && (
                        <SelectItem value={systemDefaultValue}>
                          System Default (built-in)
                        </SelectItem>
                      )}
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.isDefault && "(Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSaveTemplateDialogOpen(true)}
                  disabled={!customHtml.trim()}
                >
                  Save as Template
                </Button>
              </div>

              {previewError && (
                <div className="flex items-start gap-2 p-3 bg-zinc-100 border border-zinc-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 text-zinc-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-zinc-700 font-medium">Preview Unavailable</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{previewError}</p>
                  </div>
                </div>
              )}

              {preview && (
                <div className="border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={preview}
                    className="w-full h-[280px] bg-white"
                    title="Preview"
                  />
                </div>
              )}

              {!preview && !previewError && !isLoadingPreview && (
                <div className="flex items-center justify-center h-[200px] border border-dashed border-[var(--border-default)] rounded-lg">
                  <p className="text-sm text-muted-foreground">Click &quot;Generate Preview&quot; to see your newsletter</p>
                </div>
              )}

              <Dialog open={customHtmlOpen} onOpenChange={setCustomHtmlOpen}>
                <DialogContent className="w-[95vw] max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Customize HTML</DialogTitle>
                    <DialogDescription>Edit the HTML template for your newsletter.</DialogDescription>
                  </DialogHeader>
                  <Textarea
                    value={customHtml}
                    onChange={(event) => setCustomHtml(event.target.value)}
                    rows={16}
                    className="font-mono text-xs"
                    placeholder="Paste or edit HTML here..."
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCustomHtmlOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApplyCustomHtml} disabled={!customHtml.trim()}>
                      Apply HTML
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Save Template Dialog */}
              <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
                <DialogContent className="w-[95vw] max-w-[400px]">
                  <DialogHeader>
                    <DialogTitle>Save Template</DialogTitle>
                    <DialogDescription>Save the current HTML as a reusable template.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-3 py-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={newTemplateName}
                        onChange={(e) => setNewTemplateName(e.target.value)}
                        placeholder="My Custom Template"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="save-as-default"
                        checked={saveAsDefault}
                        onCheckedChange={(checked) => setSaveAsDefault(checked as boolean)}
                      />
                      <Label htmlFor="save-as-default" className="text-sm">
                        Set as default template
                      </Label>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSaveTemplateDialogOpen(false)
                        setNewTemplateName("")
                        setSaveAsDefault(false)
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSaveTemplate}
                      disabled={!newTemplateName.trim()}
                    >
                      Save Template
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* Step 5: Test */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="test-email">Test Email Address</Label>
                <div className="flex gap-2">
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => {
                      setTestEmail(e.target.value)
                      setTestEmailStatus(null)
                    }}
                    placeholder="test@example.com"
                    className="flex-1"
                  />
                  <Button onClick={handleSendTest} disabled={!testEmail || isSendingTest} isLoading={isSendingTest}>
                    Send Test
                  </Button>
                </div>
              </div>

              {testEmailStatus && (
                <div className={`flex items-start gap-2 p-3 rounded-lg ${
                  testEmailStatus.type === "success"
                    ? "bg-[rgba(60,53,242,0.06)] border border-[rgba(60,53,242,0.2)]"
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <AlertCircle className={`h-4 w-4 shrink-0 mt-0.5 ${
                    testEmailStatus.type === "success" ? "text-[#3c35f2]" : "text-red-600"
                  }`} />
                  <p className={`text-sm ${
                    testEmailStatus.type === "success" ? "text-[#3c35f2]" : "text-red-700"
                  }`}>
                    {testEmailStatus.message}
                  </p>
                </div>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox
                  id="test-approved"
                  checked={testApproved}
                  onCheckedChange={(checked) => setTestApproved(checked as boolean)}
                />
                <Label htmlFor="test-approved" className="text-sm">
                  I&apos;ve received and approved the test email
                </Label>
              </div>
            </div>
          )}

          {/* Step 6: Confirm */}
          {step === 6 && (
            <div className="space-y-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium">{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Schedule:</span>
                    <span className="font-medium capitalize">
                      {formData.dayOfWeek.map(d => d.slice(0, 3)).join(", ")} at {formData.time}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone:</span>
                    <span className="font-medium">{formData.timezone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audience:</span>
                    <span className="font-medium">
                      {audiences.find(a => a.id === formData.audienceId)?.name || formData.audienceId}
                    </span>
                  </div>
                  {formData.topicId && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Topic:</span>
                      <span className="font-medium">
                        {topics.find(t => t.id === formData.topicId)?.name || formData.topicId}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {sequence?.id && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Send Newsletter Now</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Send to all subscribers immediately, regardless of schedule.
                    </p>
                    <Button
                      onClick={handleSendNow}
                      disabled={isSendingNow}
                      className="w-full"
                    >
                      {isSendingNow ? "Sending..." : "Send Now to All Subscribers"}
                    </Button>
                    {sendNowStatus && (
                      <div className={`p-2 rounded-md text-xs ${
                        sendNowStatus.type === "success"
                          ? "bg-[rgba(60,53,242,0.06)] text-[#3c35f2] border border-[rgba(60,53,242,0.2)]"
                          : "bg-red-50 text-red-800 border border-red-200"
                      }`}>
                        {sendNowStatus.message}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-between gap-2 sm:justify-between">
          <Button variant="outline" onClick={step === 1 ? onClose : handleBack}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSaveDraft} disabled={!canSave}>
              Save as Draft
            </Button>
            {step < 6 ? (
              <Button onClick={handleNext} disabled={step === 1 && !formData.name}>
                Next
              </Button>
            ) : (
              <Button onClick={handlePublish} disabled={!testApproved || !canSave}>
                Publish Sequence
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
