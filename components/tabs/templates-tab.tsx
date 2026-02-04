"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Eye, PenSquare, Plus, Star, Trash2 } from "lucide-react"
import { buildNewsletterTemplateContext, DEFAULT_NEWSLETTER_TEMPLATE, renderNewsletterTemplate } from "@/lib/newsletter-template"

type NewsletterTemplate = {
  id: string
  name: string
  description?: string | null
  html: string
  isDefault: boolean
  includeFooter: boolean
  createdAt: string
  updatedAt: string
  usageCount?: number
  lastUsedAt?: string | null
}

const sampleArticles = [
  {
    id: "article-1",
    title: "OpenAI ships realtime agents for customer support",
    source_link: "https://example.com/ai-agents",
    image_link: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    summary: "Teams are shipping realtime copilots to handle first-line support without losing brand voice.",
    why_it_matters: "Faster response times with careful guardrails are becoming a competitive advantage.",
    business_value: "Lower support costs and higher CSAT with fewer escalations.",
    category: "AI Ops",
    creator: "Cucina Labs",
  },
  {
    id: "article-2",
    title: "The new playbook for email personalization",
    source_link: "https://example.com/email-personalization",
    image_link: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80",
    summary: "Personalization is shifting from token insertion to context-aware narratives.",
    why_it_matters: "Relevance lifts engagement without ballooning production cost.",
    business_value: "Higher CTR and deeper brand recall across segments.",
    category: "Marketing",
    creator: "Cucina Labs",
  },
  {
    id: "article-3",
    title: "Product teams are adopting weekly insight briefs",
    source_link: "https://example.com/weekly-briefs",
    image_link: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=80",
    summary: "Leadership teams want the signal, not the noise.",
    why_it_matters: "Reducing noise helps teams move faster with shared context.",
    business_value: "More aligned execution and faster go-to-market cycles.",
    category: "Strategy",
    creator: "Cucina Labs",
  },
]

const sampleContent = {
  subject: "Building AI Products - Weekly Menu",
  intro: "Today’s briefing highlights pragmatic wins in AI ops, personalization, and product intelligence.",
  featured_story: {
    headline: "Realtime support copilots are earning trust",
    link: "https://example.com/ai-agents",
    why_this_matters: "Leading teams pair realtime responses with human review to build reliable AI experiences.",
  },
  top_stories: [
    {
      headline: "Personalized newsletters need fewer tokens, more context",
      link: "https://example.com/email-personalization",
      why_read_it: "Context-first personalization drives engagement with less manual effort.",
    },
    {
      headline: "Product leaders want weekly insight briefs",
      link: "https://example.com/weekly-briefs",
      why_read_it: "Briefs help teams align on product bets and customer signals.",
    },
    {
      headline: "Signals that AI operations are maturing",
      link: "https://example.com/ai-ops",
      why_read_it: "Reliability tooling is shifting from reactive to proactive.",
    },
  ],
  looking_ahead: "Next week we will cover onboarding flows for AI copilots and retention loops for newsletters.",
  from_chefs_table: {
    title: "This Week in the Kitchen",
    body: "Hey Chefs! This week’s menu focuses on practical product moves: three stories shaping PM decisions, a handful of great reads, and one thing we are actively building in the lab.",
  },
  news: [
    {
      id: 1,
      headline: "Realtime support copilots are earning trust",
      why_this_matters: "Teams are proving that fast AI responses and human safeguards can coexist. PMs can now design support flows that cut response time while keeping quality high.",
      source: "Cucina Labs",
      link: "https://example.com/ai-agents",
    },
    {
      id: 2,
      headline: "Context-first personalization beats token tricks",
      why_this_matters: "The strongest teams are personalizing around user state, not just names. That makes messaging more relevant without increasing operational drag.",
      source: "Cucina Labs",
      link: "https://example.com/email-personalization",
    },
    {
      id: 3,
      headline: "Weekly insight briefs are becoming a product ritual",
      why_this_matters: "Teams are using short weekly summaries to align roadmap tradeoffs. This creates faster decisions across product, design, and engineering.",
      source: "Cucina Labs",
      link: "https://example.com/weekly-briefs",
    },
  ],
  what_were_reading: [
    {
      title: "Designing better AI onboarding",
      url: "https://example.com/ai-onboarding",
      description: "A practical walkthrough of first-run experiences that reduce confusion and increase activation.",
    },
    {
      title: "How PMs evaluate model changes",
      url: "https://example.com/model-evals",
      description: "A clear framework for balancing quality, speed, and reliability in model updates.",
    },
    {
      title: "Shipping iteration loops that actually stick",
      url: "https://example.com/iteration-loops",
      description: "Concrete examples of feedback loops that improve weekly shipping confidence.",
    },
  ],
  what_were_cooking: {
    title: "AI-driven triage assistant",
    url: "https://example.com/triage-assistant",
    description: "We are testing a triage assistant that groups customer feedback into decision-ready themes for PM review.",
  },
}

const variableHints = [
  "{{newsletter.subject}}",
  "{{newsletter.intro}}",
  "{{newsletter.top_stories}}",
  "{{newsletter.featured_story}}",
  "{{weekly.from_chefs_table}}",
  "{{weekly.news}}",
  "{{weekly.what_were_reading}}",
  "{{weekly.what_were_cooking}}",
  "{{featured}}",
  "{{articles}}",
  "{{currentDate}}",
  "{{unsubscribeUrl}}",
  "{{bannerUrl}}",
]

export function TemplatesTab() {
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [previewTemplate, setPreviewTemplate] = useState<NewsletterTemplate | null>(null)
  const [formState, setFormState] = useState({
    id: "",
    name: "",
    description: "",
    html: DEFAULT_NEWSLETTER_TEMPLATE,
    isDefault: false,
    includeFooter: true,
  })

  const sampleContext = useMemo(
    () =>
      buildNewsletterTemplateContext({
        content: sampleContent,
        articles: sampleArticles,
        origin: "",
      }),
    []
  )

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/newsletter-templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const openCreate = () => {
    setFormState({
      id: "",
      name: "",
      description: "",
      html: DEFAULT_NEWSLETTER_TEMPLATE,
      isDefault: templates.length === 0,
      includeFooter: true,
    })
    setEditorOpen(true)
  }

  const openEdit = (template: NewsletterTemplate) => {
    setFormState({
      id: template.id,
      name: template.name,
      description: template.description || "",
      html: template.html,
      isDefault: template.isDefault,
      includeFooter: template.includeFooter,
    })
    setEditorOpen(true)
  }

  const openPreview = (template: NewsletterTemplate) => {
    setPreviewTemplate(template)
    setPreviewMode("desktop")
    setPreviewOpen(true)
  }

  const handleSave = async () => {
    if (!formState.name.trim() || !formState.html.trim()) {
      alert("Name and HTML are required.")
      return
    }

    const payload = {
      name: formState.name.trim(),
      description: formState.description.trim(),
      html: formState.html,
      isDefault: formState.isDefault,
      includeFooter: formState.includeFooter,
    }

    try {
      const response = await fetch(
        formState.id ? `/api/newsletter-templates/${formState.id}` : "/api/newsletter-templates",
        {
          method: formState.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      const data = await response.json()
      if (!response.ok) {
        alert(data?.details || data?.error || "Failed to save template.")
        return
      }

      setEditorOpen(false)
      await fetchTemplates()
    } catch (error) {
      console.error("Failed to save template:", error)
      alert("Failed to save template.")
    }
  }

  const handleSetDefault = async (template: NewsletterTemplate) => {
    try {
      const response = await fetch(`/api/newsletter-templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          description: template.description || "",
          html: template.html,
          isDefault: true,
          includeFooter: template.includeFooter,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        alert(data?.details || data?.error || "Failed to set default template.")
        return
      }

      await fetchTemplates()
    } catch (error) {
      console.error("Failed to set default template:", error)
      alert("Failed to set default template.")
    }
  }

  const handleDelete = async (template: NewsletterTemplate) => {
    if (!confirm(`Delete template "${template.name}"?`)) return

    try {
      const response = await fetch(`/api/newsletter-templates/${template.id}`, {
        method: "DELETE",
      })
      const data = await response.json()
      if (!response.ok) {
        alert(data?.details || data?.error || "Failed to delete template.")
        return
      }
      await fetchTemplates()
    } catch (error) {
      console.error("Failed to delete template:", error)
      alert("Failed to delete template.")
    }
  }

  const renderTemplate = (html: string) => {
    if (!html) return { html: "", error: "" }
    try {
      const rendered = renderNewsletterTemplate(html, sampleContext)
      return { html: rendered, error: "" }
    } catch (error) {
      return { html: "", error: "Preview failed. Check for invalid template variables." }
    }
  }

  const editorPreview = renderTemplate(formState.html)
  const modalPreview = renderTemplate(previewTemplate?.html || "")

  const previewWidth = previewMode === "mobile" ? "max-w-[420px]" : "max-w-full"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold">Email Templates</h2>
          <p className="text-muted-foreground mt-1">
            Create, edit, and manage newsletter templates
          </p>
        </div>
        <Button onClick={openCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Create Template
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            Default templates are used for new sequences unless another template is chosen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {templates.length === 0 && !isLoading && (
            <div className="text-sm text-muted-foreground">
              No templates yet. Create one to get started.
            </div>
          )}

          {templates.map((template) => (
            <div
              key={template.id}
              className="flex flex-col gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  {template.isDefault && <Badge variant="success">Default</Badge>}
                </div>
                {template.description && (
                  <p className="text-sm text-[color:var(--text-secondary)]">
                    {template.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-[color:var(--text-secondary)]">
                  <span>Updated {new Date(template.updatedAt).toLocaleString()}</span>
                  <span>Used by {template.usageCount ?? 0} sequence(s)</span>
                  {template.lastUsedAt && (
                    <span>Last sent {new Date(template.lastUsedAt).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => openPreview(template)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="outline" size="sm" onClick={() => openEdit(template)}>
                  <PenSquare className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                {!template.isDefault && (
                  <Button variant="outline" size="sm" onClick={() => handleSetDefault(template)}>
                    <Star className="mr-2 h-4 w-4" />
                    Set Default
                  </Button>
                )}
                {!template.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(template)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-[95vw] w-full lg:max-w-6xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{formState.id ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              Edit HTML content and preview it with sample newsletter data.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-2 flex-1 overflow-hidden">
            <div className="space-y-4 overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label htmlFor="template-name">Name</Label>
                <Input
                  id="template-name"
                  value={formState.name}
                  onChange={(event) => setFormState({ ...formState, name: event.target.value })}
                  placeholder="Template name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description</Label>
                <Textarea
                  id="template-description"
                  value={formState.description}
                  onChange={(event) =>
                    setFormState({ ...formState, description: event.target.value })
                  }
                  placeholder="Short description (optional)"
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-html">HTML</Label>
                <Textarea
                  id="template-html"
                  value={formState.html}
                  onChange={(event) => setFormState({ ...formState, html: event.target.value })}
                  placeholder="Paste your template HTML here"
                  className="min-h-[300px] font-mono text-xs lg:min-h-[400px]"
                />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="template-default"
                    checked={formState.isDefault}
                    onCheckedChange={(value) =>
                      setFormState({ ...formState, isDefault: Boolean(value) })
                    }
                  />
                  <Label htmlFor="template-default">Set as default template</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="template-footer"
                    checked={formState.includeFooter}
                    onCheckedChange={(value) =>
                      setFormState({ ...formState, includeFooter: Boolean(value) })
                    }
                  />
                  <Label htmlFor="template-footer">Include unsubscribe footer</Label>
                </div>
              </div>
              <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-muted)] p-3 text-xs text-[color:var(--text-secondary)]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">
                  Template Variables
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {variableHints.map((variable) => (
                    <span key={variable} className="rounded-full bg-white px-3 py-1">
                      {variable}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-h-0">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">Live Preview</h3>
                  <p className="text-xs text-[color:var(--text-secondary)]">
                    Rendered with sample newsletter data.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={previewMode === "desktop" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("desktop")}
                  >
                    Desktop
                  </Button>
                  <Button
                    variant={previewMode === "mobile" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("mobile")}
                  >
                    Mobile
                  </Button>
                </div>
              </div>
              <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-muted)] p-3 min-h-[400px]">
                {editorPreview.error ? (
                  <div className="text-sm text-red-600">{editorPreview.error}</div>
                ) : (
                  <div className={`mx-auto h-full ${previewWidth}`}>
                    <iframe
                      title="Template preview"
                      className="h-full w-full rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white"
                      srcDoc={editorPreview.html}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-4 border-t border-[var(--border-default)]">
            <Button variant="outline" onClick={() => setEditorOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} className="w-full sm:w-auto">
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-[95vw] w-full lg:max-w-5xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{previewTemplate?.name || "Template Preview"}</DialogTitle>
            <DialogDescription>Preview with sample newsletter data.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant={previewMode === "desktop" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode("desktop")}
            >
              Desktop
            </Button>
            <Button
              variant={previewMode === "mobile" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewMode("mobile")}
            >
              Mobile
            </Button>
          </div>
          <div className="flex-1 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--bg-muted)] p-3 min-h-[500px]">
            {modalPreview.error ? (
              <div className="text-sm text-red-600">{modalPreview.error}</div>
            ) : (
              <div className={`mx-auto h-full ${previewWidth}`}>
                <iframe
                  title="Template preview modal"
                  className="h-full w-full rounded-[12px] border border-[rgba(0,0,0,0.08)] bg-white min-h-[480px]"
                  srcDoc={modalPreview.html}
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
