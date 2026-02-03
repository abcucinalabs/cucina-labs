"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Eye,
  RefreshCw,
  Sparkles,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  ChefHat,
  Newspaper,
  BookOpen,
  FlaskConical,
  Check,
} from "lucide-react"

type SavedContent = {
  id: string
  type: string
  title: string
  url?: string
  description?: string
  source?: string
  used: boolean
  createdAt: string
}

type NewsItem = {
  id?: string
  title: string
  url: string
  summary: string
  source?: string
}

type CookingItem = {
  title: string
  description: string
  url?: string
}

type WeeklyNewsletter = {
  id: string
  weekStart: string
  weekEnd: string
  status: string
  chefsTableTitle?: string
  chefsTableBody?: string
  newsItems?: NewsItem[]
  recipeIds: string[]
  cookingItems?: CookingItem[]
  audienceId?: string
  recipes?: SavedContent[]
}

type Audience = {
  id: string
  name: string
}

export function WeeklyNewsletterTab() {
  const [newsletter, setNewsletter] = useState<WeeklyNewsletter | null>(null)
  const [savedContent, setSavedContent] = useState<SavedContent[]>([])
  const [audiences, setAudiences] = useState<Audience[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFetchingNews, setIsFetchingNews] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState("")
  const [testEmail, setTestEmail] = useState("")

  // New cooking item form
  const [newCookingItem, setNewCookingItem] = useState<CookingItem>({
    title: "",
    description: "",
    url: "",
  })

  useEffect(() => {
    loadCurrentNewsletter()
    loadSavedContent()
    loadAudiences()
  }, [])

  const loadCurrentNewsletter = async () => {
    try {
      const res = await fetch("/api/weekly-newsletter?current=true")
      if (res.ok) {
        const data = await res.json()
        setNewsletter(data)
      }
    } catch (error) {
      console.error("Failed to load newsletter:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSavedContent = async () => {
    try {
      const res = await fetch("/api/saved-content?type=reading&used=false")
      if (res.ok) {
        const data = await res.json()
        setSavedContent(data)
      }
    } catch (error) {
      console.error("Failed to load saved content:", error)
    }
  }

  const loadAudiences = async () => {
    try {
      const res = await fetch("/api/resend/audiences")
      if (res.ok) {
        const data = await res.json()
        setAudiences(data)
      }
    } catch (error) {
      console.error("Failed to load audiences:", error)
    }
  }

  const updateNewsletter = async (updates: Partial<WeeklyNewsletter>) => {
    if (!newsletter) return

    try {
      const res = await fetch(`/api/weekly-newsletter/${newsletter.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      })
      if (res.ok) {
        const data = await res.json()
        setNewsletter({ ...newsletter, ...data })
      }
    } catch (error) {
      console.error("Failed to update newsletter:", error)
    }
  }

  const fetchNewsFromDatabase = async () => {
    setIsFetchingNews(true)
    try {
      const res = await fetch("/api/weekly-newsletter/fetch-news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: 3 }),
      })
      if (res.ok) {
        const data = await res.json()
        await updateNewsletter({ newsItems: data.items })
      } else {
        const error = await res.json()
        alert(`Failed to fetch news: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to fetch news:", error)
      alert("Failed to fetch news")
    } finally {
      setIsFetchingNews(false)
    }
  }

  const generateChefsTable = async () => {
    if (!newsletter) return

    setIsGenerating(true)
    try {
      const res = await fetch(`/api/weekly-newsletter/${newsletter.id}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = await res.json()
        setNewsletter({ ...newsletter, ...data.newsletter })
      } else {
        const error = await res.json()
        alert(`Failed to generate: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to generate:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleRecipe = async (contentId: string) => {
    if (!newsletter) return

    const currentIds = newsletter.recipeIds || []
    const newIds = currentIds.includes(contentId)
      ? currentIds.filter((id) => id !== contentId)
      : [...currentIds, contentId]

    await updateNewsletter({ recipeIds: newIds })
  }

  const addCookingItem = async () => {
    if (!newsletter || !newCookingItem.title) return

    const currentItems = (newsletter.cookingItems || []) as CookingItem[]
    const newItems = [...currentItems, newCookingItem]

    await updateNewsletter({ cookingItems: newItems })
    setNewCookingItem({ title: "", description: "", url: "" })
  }

  const removeCookingItem = async (index: number) => {
    if (!newsletter) return

    const currentItems = (newsletter.cookingItems || []) as CookingItem[]
    const newItems = currentItems.filter((_, i) => i !== index)

    await updateNewsletter({ cookingItems: newItems })
  }

  const previewNewsletter = async () => {
    if (!newsletter) return

    try {
      const res = await fetch(`/api/weekly-newsletter/${newsletter.id}/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origin: window.location.origin }),
      })
      if (res.ok) {
        const data = await res.json()
        setPreviewHtml(data.html)
        setShowPreview(true)
      }
    } catch (error) {
      console.error("Failed to preview:", error)
    }
  }

  const sendNewsletter = async (isTest: boolean) => {
    if (!newsletter) return

    setIsSending(true)
    try {
      const res = await fetch(`/api/weekly-newsletter/${newsletter.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testEmail: isTest ? testEmail : undefined,
          origin: window.location.origin,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (isTest) {
          alert(`Test email sent to ${testEmail}`)
        } else {
          alert("Newsletter sent successfully!")
          loadCurrentNewsletter()
        }
      } else {
        const error = await res.json()
        alert(`Failed to send: ${error.error}`)
      }
    } catch (error) {
      console.error("Failed to send:", error)
    } finally {
      setIsSending(false)
    }
  }

  const formatWeekOf = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Loading newsletter...
        </CardContent>
      </Card>
    )
  }

  if (!newsletter) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          Failed to load newsletter
        </CardContent>
      </Card>
    )
  }

  const newsItems = (newsletter.newsItems || []) as NewsItem[]
  const cookingItems = (newsletter.cookingItems || []) as CookingItem[]
  const selectedReading = savedContent.filter((c) =>
    newsletter.recipeIds?.includes(c.id)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ChefHat className="h-5 w-5" />
                Weekly Newsletter
              </CardTitle>
              <CardDescription>
                Week of {formatWeekOf(newsletter.weekStart)}
              </CardDescription>
            </div>
            <Badge
              variant={
                newsletter.status === "sent"
                  ? "default"
                  : newsletter.status === "scheduled"
                  ? "secondary"
                  : "outline"
              }
            >
              {newsletter.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" onClick={previewNewsletter}>
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <div className="flex items-center gap-2">
              <Input
                placeholder="test@email.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="w-48"
              />
              <Button
                variant="outline"
                onClick={() => sendNewsletter(true)}
                disabled={!testEmail || isSending}
              >
                Send Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chef's Table Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ChefHat className="h-4 w-4 text-purple-500" />
            Chef&apos;s Table
          </CardTitle>
          <CardDescription>
            AI-generated intro that sets the mood for the newsletter
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Title (optional)</Label>
            <Input
              value={newsletter.chefsTableTitle || ""}
              onChange={(e) => updateNewsletter({ chefsTableTitle: e.target.value })}
              placeholder="A catchy title for this week..."
            />
          </div>
          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              value={newsletter.chefsTableBody || ""}
              onChange={(e) => updateNewsletter({ chefsTableBody: e.target.value })}
              placeholder="The intro paragraph..."
              className="min-h-[100px]"
            />
          </div>
          <Button
            variant="outline"
            onClick={generateChefsTable}
            disabled={isGenerating}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {isGenerating ? "Generating..." : "Generate with AI"}
          </Button>
        </CardContent>
      </Card>

      {/* News Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Newspaper className="h-4 w-4 text-blue-500" />
                News
              </CardTitle>
              <CardDescription>
                Top 3 stories from recent articles
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchNewsFromDatabase}
              disabled={isFetchingNews}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isFetchingNews ? "animate-spin" : ""}`} />
              Fetch News
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {newsItems.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No news items yet. Click &quot;Fetch News&quot; to pull recent articles.
            </p>
          ) : (
            <div className="space-y-4">
              {newsItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/30"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-md bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {item.summary && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {item.summary}
                      </p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                      >
                        Read more <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* What We're Reading Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-4 w-4 text-green-500" />
            What We&apos;re Reading
          </CardTitle>
          <CardDescription>
            Posts and articles you&apos;ve saved to share
          </CardDescription>
        </CardHeader>
        <CardContent>
          {savedContent.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No saved content yet. Use the mobile save page to add articles and posts.
            </p>
          ) : (
            <div className="space-y-2">
              {savedContent.map((content) => {
                const isSelected = newsletter.recipeIds?.includes(content.id)
                return (
                  <div
                    key={content.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleRecipe(content.id)}
                  >
                    <div
                      className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
                        isSelected
                          ? "bg-green-500 border-green-500 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{content.title}</h4>
                        {content.source && (
                          <Badge variant="secondary" className="text-xs">
                            {content.source}
                          </Badge>
                        )}
                      </div>
                      {content.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {content.description}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
          {selectedReading.length > 0 && (
            <p className="text-sm text-muted-foreground mt-3">
              {selectedReading.length} reading item(s) selected
            </p>
          )}
        </CardContent>
      </Card>

      {/* What We're Cooking Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <FlaskConical className="h-4 w-4 text-orange-500" />
            What We&apos;re Cooking
          </CardTitle>
          <CardDescription>
            Experiments and projects to highlight this week
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {cookingItems.length > 0 && (
            <div className="space-y-2">
              {cookingItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-orange-50/50 dark:bg-orange-950/20"
                >
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.description}
                      </p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                      >
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => removeCookingItem(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new cooking item */}
          <div className="space-y-3 p-4 rounded-lg border border-dashed">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={newCookingItem.title}
                onChange={(e) =>
                  setNewCookingItem({ ...newCookingItem, title: e.target.value })
                }
                placeholder="Project or experiment name"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={newCookingItem.description}
                onChange={(e) =>
                  setNewCookingItem({ ...newCookingItem, description: e.target.value })
                }
                placeholder="What's this about?"
                className="min-h-[60px]"
              />
            </div>
            <div className="space-y-2">
              <Label>URL (optional)</Label>
              <Input
                value={newCookingItem.url}
                onChange={(e) =>
                  setNewCookingItem({ ...newCookingItem, url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <Button
              variant="outline"
              onClick={addCookingItem}
              disabled={!newCookingItem.title}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Send Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Send Newsletter</CardTitle>
          <CardDescription>Choose an audience and send</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Audience</Label>
            <Select
              value={newsletter.audienceId || ""}
              onValueChange={(value) => updateNewsletter({ audienceId: value })}
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
          </div>
          <Button
            onClick={() => sendNewsletter(false)}
            disabled={!newsletter.audienceId || isSending || newsletter.status === "sent"}
          >
            <Send className="mr-2 h-4 w-4" />
            {isSending ? "Sending..." : "Send to Audience"}
          </Button>
          {newsletter.status === "sent" && (
            <p className="text-sm text-muted-foreground">
              This newsletter has already been sent.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="font-medium">Newsletter Preview</span>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
            <iframe
              title="Newsletter preview"
              className="flex-1 w-full min-h-[600px] border-0"
              srcDoc={previewHtml}
            />
          </div>
        </div>
      )}
    </div>
  )
}
