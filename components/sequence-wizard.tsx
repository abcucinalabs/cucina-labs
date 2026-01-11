"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DayPicker } from "@/components/ui/day-picker"
import { RotateCcw, AlertCircle } from "lucide-react"
import {
  DEFAULT_NEWSLETTER_TEMPLATE,
  buildNewsletterTemplateContext,
  renderNewsletterTemplate,
} from "@/lib/newsletter-template"

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
    dayOfWeek: [] as string[],
    time: "09:00",
    timezone: "America/New_York",
    systemPrompt: "",
    userPrompt: "",
  })
  const [audiences, setAudiences] = useState<any[]>([])
  const [testEmail, setTestEmail] = useState("")
  const [testApproved, setTestApproved] = useState(false)
  const [preview, setPreview] = useState("")
  const [previewError, setPreviewError] = useState("")
  const [customHtml, setCustomHtml] = useState("")
  const [customHtmlOpen, setCustomHtmlOpen] = useState(false)
  const [previewData, setPreviewData] = useState<{ content: any; articles: any[] } | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(false)
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testEmailStatus, setTestEmailStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [saveTemplateDialogOpen, setSaveTemplateDialogOpen] = useState(false)
  const [newTemplateName, setNewTemplateName] = useState("")
  const [saveAsDefault, setSaveAsDefault] = useState(false)

  useEffect(() => {
    if (open) {
      if (!sequence) {
        setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
      } else if (!customHtml) {
        setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
      }
      fetchAudiences()
      fetchTemplates()
      if (sequence) {
        setFormData({
          name: sequence.name || "",
          audienceId: sequence.audienceId || "",
          dayOfWeek: sequence.dayOfWeek || [],
          time: sequence.time || "09:00",
          timezone: sequence.timezone || "America/New_York",
          systemPrompt: sequence.systemPrompt || "",
          userPrompt: sequence.userPrompt || "",
        })
      } else {
        // Load default prompts for new sequences
        loadDefaultPrompts()
      }
      setPreviewData(null)
    }
  }, [open, sequence, customHtml])

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

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/newsletter-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    }
  }

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim() || !customHtml.trim()) return

    try {
      const response = await fetch("/api/newsletter-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newTemplateName,
          html: customHtml,
          isDefault: saveAsDefault
        })
      })

      if (response.ok) {
        const template = await response.json()
        // Refresh the templates list to get updated isDefault flags
        await fetchTemplates()
        setSelectedTemplateId(template.id)
        setSaveTemplateDialogOpen(false)
        setNewTemplateName("")
        setSaveAsDefault(false)
      }
    } catch (error) {
      console.error("Failed to save template:", error)
    }
  }

  const handleLoadTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (template) {
      setCustomHtml(template.html)
      setSelectedTemplateId(templateId)
    }
  }

  const loadDefaultPrompts = async () => {
    setIsLoadingDefaults(true)
    try {
      const response = await fetch("/api/sequences/defaults")
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          systemPrompt: data.systemPrompt || "",
          userPrompt: data.userPrompt || "",
        }))
      }
    } catch (error) {
      console.error("Failed to load default prompts:", error)
    } finally {
      setIsLoadingDefaults(false)
    }
  }

  const handleResetPrompts = async () => {
    setIsLoadingDefaults(true)
    try {
      const response = await fetch("/api/sequences/defaults")
      if (response.ok) {
        const data = await response.json()
        setFormData(prev => ({
          ...prev,
          systemPrompt: data.systemPrompt || "",
          userPrompt: data.userPrompt || "",
        }))
      }
    } catch (error) {
      console.error("Failed to reset prompts:", error)
    } finally {
      setIsLoadingDefaults(false)
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
          ...formData,
          htmlTemplate: customHtml
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
    // Set the textarea value after dialog opens
    setTimeout(() => {
      if (htmlTextareaRef.current) {
        htmlTextareaRef.current.value = customHtml || DEFAULT_NEWSLETTER_TEMPLATE
      }
    }, 100)
  }

  const handleApplyCustomHtml = () => {
    console.log("Apply HTML clicked")
    const htmlValue = htmlTextareaRef.current?.value || ""
    console.log("HTML value length:", htmlValue.length)

    if (!htmlValue.trim()) {
      console.log("HTML is empty")
      alert("Please enter some HTML content")
      return
    }

    if (!previewData) {
      console.log("No preview data available")
      alert("Please generate a preview first by clicking 'Generate Preview' button")
      setPreviewError("Generate a preview first to load newsletter data.")
      setCustomHtmlOpen(false)
      return
    }

    try {
      console.log("Rendering custom HTML...")
      const context = buildNewsletterTemplateContext({
        content: previewData.content,
        articles: previewData.articles,
        origin: typeof window !== "undefined" ? window.location.origin : "",
      })
      const html = renderNewsletterTemplate(htmlValue, context)
      setPreview(html)
      setCustomHtml(htmlValue) // Update state with the new value
      setPreviewError("")
      setCustomHtmlOpen(false)
      console.log("Custom HTML applied successfully")
    } catch (error) {
      console.error("Failed to render custom HTML:", error)
      alert(`Failed to render HTML: ${error instanceof Error ? error.message : 'Unknown error'}`)
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
        body: JSON.stringify({ ...formData, testEmail, customHtml }),
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
  const canSave = Boolean(formData.name && formData.audienceId && formData.userPrompt)

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {sequence ? "Edit Sequence" : "Create New Sequence"} - Step {step} of 6
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Basic information about your sequence"}
            {step === 2 && "When should this sequence run?"}
            {step === 3 && "Configure AI prompts for content selection"}
            {step === 4 && "Preview the generated newsletter"}
            {step === 5 && "Send a test email to verify"}
            {step === 6 && "Review and publish your sequence"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Sequence Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Daily Digest"
                />
              </div>
              <div className="space-y-2">
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
                <p className="text-xs text-muted-foreground">
                  Audiences are fetched from your Resend account. Create audiences in Resend to target specific segments.
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Schedule */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="space-y-3">
                <Label>Select Days</Label>
                <DayPicker
                  value={formData.dayOfWeek}
                  onChange={(days) => setFormData({ ...formData, dayOfWeek: days })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Time</Label>
                  <div className="flex gap-2">
                    <Select
                      value={hour12.toString().padStart(2, "0")}
                      onValueChange={(h) => {
                        const newHour = ampm === "PM" && h !== "12" ? parseInt(h) + 12 : (ampm === "AM" && h === "12" ? 0 : parseInt(h))
                        setFormData({ ...formData, time: `${newHour.toString().padStart(2, "0")}:${minutes}` })
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
                      onValueChange={(m) => setFormData({ ...formData, time: `${hours}:${m}` })}
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
                        setFormData({ ...formData, time: `${newHour.toString().padStart(2, "0")}:${minutes}` })
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

                <div className="space-y-2 col-span-2">
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
            </div>
          )}

          {/* Step 3: Prompts */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base">AI Prompts Configuration</Label>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetPrompts}
                  disabled={isLoadingDefaults}
                  isLoading={isLoadingDefaults}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Default
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={formData.systemPrompt}
                  onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
                  rows={8}
                  className="font-mono text-sm"
                  placeholder="You are the Editor of a daily digest..."
                />
                <p className="text-xs text-muted-foreground">
                  {formData.systemPrompt.length} characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="user-prompt">User Prompt</Label>
                <Textarea
                  id="user-prompt"
                  value={formData.userPrompt}
                  onChange={(e) => setFormData({ ...formData, userPrompt: e.target.value })}
                  rows={10}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {formData.userPrompt.length} characters • Use {"{{ variable }}"} for template variables
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Preview */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Button onClick={handleGeneratePreview} disabled={isLoadingPreview} isLoading={isLoadingPreview}>
                  Generate Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={handleOpenCustomHtml}
                >
                  Customize HTML
                </Button>
              </div>

              {/* Template Management */}
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="template-select">Load Template</Label>
                  <Select
                    value={selectedTemplateId}
                    onValueChange={(value) => {
                      if (value === "default") {
                        setCustomHtml(DEFAULT_NEWSLETTER_TEMPLATE)
                        setSelectedTemplateId("")
                      } else {
                        handleLoadTemplate(value)
                      }
                    }}
                  >
                    <SelectTrigger id="template-select">
                      <SelectValue placeholder="Select a template..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Template</SelectItem>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name} {template.isDefault && "(Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="pt-8">
                  <Button
                    variant="outline"
                    onClick={() => setSaveTemplateDialogOpen(true)}
                    disabled={!customHtml.trim()}
                  >
                    Save as Template
                  </Button>
                </div>
              </div>
              
              {previewError && (
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-700 font-medium">Preview Unavailable</p>
                    <p className="text-sm text-muted-foreground mt-1">{previewError}</p>
                  </div>
                </div>
              )}
              
              {preview && (
                <div className="border border-[var(--border-default)] rounded-lg overflow-hidden">
                  <iframe
                    srcDoc={preview}
                    className="w-full h-[500px] bg-white"
                    title="Preview"
                  />
                </div>
              )}
              
              {!preview && !previewError && !isLoadingPreview && (
                <div className="flex items-center justify-center h-64 border border-dashed border-[var(--border-default)] rounded-lg">
                  <p className="text-muted-foreground">Click &quot;Generate Preview&quot; to see your newsletter</p>
                </div>
              )}

              <Dialog open={customHtmlOpen} onOpenChange={setCustomHtmlOpen} modal={true}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Customize HTML</DialogTitle>
                    <DialogDescription>Edit the generated HTML and apply it to the preview.</DialogDescription>
                  </DialogHeader>
                  <textarea
                    ref={htmlTextareaRef}
                    defaultValue={customHtml}
                    rows={20}
                    className="w-full min-h-[500px] font-mono text-xs p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y bg-white text-gray-900"
                    placeholder="Paste or edit HTML here..."
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    style={{
                      WebkitUserSelect: 'text',
                      userSelect: 'text',
                      pointerEvents: 'auto',
                      cursor: 'text'
                    }}
                  />
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCustomHtmlOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleApplyCustomHtml}>
                      Apply HTML
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Save Template Dialog */}
              <Dialog open={saveTemplateDialogOpen} onOpenChange={setSaveTemplateDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Save Template</DialogTitle>
                    <DialogDescription>Save the current HTML as a reusable template.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
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
                      <Label htmlFor="save-as-default">
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
              <div className="space-y-2">
                <Label htmlFor="test-email">Test Email Address</Label>
                <Input
                  id="test-email"
                  type="email"
                  value={testEmail}
                  onChange={(e) => {
                    setTestEmail(e.target.value)
                    setTestEmailStatus(null)
                  }}
                  placeholder="test@example.com"
                />
              </div>
              <Button onClick={handleSendTest} disabled={!testEmail || isSendingTest} isLoading={isSendingTest}>
                Send Test Email
              </Button>
              
              {testEmailStatus && (
                <div className={`flex items-start gap-3 p-4 rounded-lg ${
                  testEmailStatus.type === "success" 
                    ? "bg-green-500/10 border border-green-500/20" 
                    : "bg-red-500/10 border border-red-500/20"
                }`}>
                  <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${
                    testEmailStatus.type === "success" ? "text-green-600" : "text-red-600"
                  }`} />
                  <p className={`text-sm ${
                    testEmailStatus.type === "success" ? "text-green-700" : "text-red-700"
                  }`}>
                    {testEmailStatus.message}
                  </p>
                </div>
              )}
              
              <div className="flex items-center space-x-2 pt-4">
                <Checkbox
                  id="test-approved"
                  checked={testApproved}
                  onCheckedChange={(checked) => setTestApproved(checked as boolean)}
                />
                <Label htmlFor="test-approved">
                  I&apos;ve received and approved the test email
                </Label>
              </div>
            </div>
          )}

          {/* Step 6: Confirm */}
          {step === 6 && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
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
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={step === 1 ? onClose : handleBack}>
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          <div className="flex items-center gap-3">
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
