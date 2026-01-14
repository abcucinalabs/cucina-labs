"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MetricCard } from "@/components/dashboard/metric-card"
import { cn } from "@/lib/utils"

type DashboardData = {
  period: { label: string; start: string; end: string }
  emailMetrics: {
    newslettersSent: number
    totalClicks: number
    deliveryRate: number | null
    openRate: number | null
    clickRate: number | null
    bounceRate: number | null
    unsubscribeRate: number | null
    trackingStatus: "unconfigured" | "partial" | "ready"
  }
  subscriberMetrics: {
    totalActive: number
    newSubscribers: number
    unsubscribed: number
    netGrowth: number
    daily: Array<{ date: string; new: number; unsubscribed: number }>
  }
  articleStats: Array<{
    id: string
    title: string
    clicks: number
    clickShare: number
    url: string
    category?: string
    creator?: string
  }>
  recentNewsletters: Array<{
    id: string
    sequenceName: string
    status: string
    sentAt: string
    broadcastId?: string | null
  }>
  systemHealth: {
    lastIngestion: { event: string; status: string; createdAt: string; message: string } | null
    lastDistribution: { event: string; status: string; createdAt: string; message: string } | null
    integrations: Array<{ service: string; status: string; updatedAt: string }>
    activeSequences: Array<{
      id: string
      name: string
      schedule: string
      time: string
      timezone: string
      dayOfWeek: string[]
    }>
  }
}

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
]

const formatNumber = (value: number) => value.toLocaleString()

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}%`
}

const formatDate = (value: string) => {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

export function DashboardPage() {
  const [period, setPeriod] = useState("30d")
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/admin/analytics?period=${period}`, {
          cache: "no-store",
        })
        if (!response.ok) {
          throw new Error("Failed to load dashboard data")
        }
        const payload = (await response.json()) as DashboardData
        if (isMounted) {
          setData(payload)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to load dashboard data")
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }
    loadData()
    return () => {
      isMounted = false
    }
  }, [period])

  const growthMax = useMemo(() => {
    if (!data?.subscriberMetrics.daily.length) return 1
    return Math.max(
      1,
      ...data.subscriberMetrics.daily.map((entry) =>
        Math.max(entry.new, entry.unsubscribed)
      )
    )
  }, [data])

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-[color:var(--text-secondary)] mt-2">
            Monitor performance, engagement, and system health at a glance.
          </p>
        </div>
        <div className="min-w-[200px]">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-[color:var(--text-secondary)]">
            {error}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Newsletters sent"
          value={data ? formatNumber(data.emailMetrics.newslettersSent) : "—"}
          helper={data ? data.period.label : "Loading"}
        />
        <MetricCard
          label="Total clicks"
          value={data ? formatNumber(data.emailMetrics.totalClicks) : "—"}
          helper="Short link clicks"
          accent="text-[color:var(--accent-primary-dark)]"
        />
        <MetricCard
          label="Active subscribers"
          value={data ? formatNumber(data.subscriberMetrics.totalActive) : "—"}
          helper="Currently subscribed"
        />
        <MetricCard
          label="Net growth"
          value={data ? formatNumber(data.subscriberMetrics.netGrowth) : "—"}
          helper={`${data?.subscriberMetrics.newSubscribers ?? 0} new · ${data?.subscriberMetrics.unsubscribed ?? 0} lost`}
          accent={data?.subscriberMetrics.netGrowth && data.subscriberMetrics.netGrowth < 0 ? "text-rose-500" : "text-emerald-600"}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Email performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                  Delivery rate
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatPercent(data?.emailMetrics.deliveryRate ?? null)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                  Open rate
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatPercent(data?.emailMetrics.openRate ?? null)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                  Click-through rate
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatPercent(data?.emailMetrics.clickRate ?? null)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                  Unsubscribe rate
                </p>
                <p className="mt-2 text-xl font-semibold">
                  {formatPercent(data?.emailMetrics.unsubscribeRate ?? null)}
                </p>
              </div>
            </div>
            {data?.emailMetrics.trackingStatus !== "ready" ? (
              <p className="mt-4 text-xs text-[color:var(--text-secondary)]">
                Email delivery and open tracking is not configured yet. Metrics will populate once tracking events are stored.
              </p>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscriber growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.subscriberMetrics.daily || []).map((entry) => {
                const newWidth = Math.round((entry.new / growthMax) * 100)
                const unsubWidth = Math.round((entry.unsubscribed / growthMax) * 100)
                return (
                  <div key={entry.date} className="flex items-center gap-3 text-sm">
                    <span className="w-16 text-[color:var(--text-secondary)]">
                      {new Date(entry.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <div className="flex-1">
                      <div className="h-2 rounded-full bg-[var(--bg-muted)]">
                        <div
                          className="h-2 rounded-full bg-emerald-400"
                          style={{ width: `${newWidth}%` }}
                        />
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-[var(--bg-muted)]">
                        <div
                          className="h-2 rounded-full bg-rose-300"
                          style={{ width: `${unsubWidth}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-20 text-right text-xs text-[color:var(--text-secondary)]">
                      +{entry.new} / -{entry.unsubscribed}
                    </div>
                  </div>
                )
              })}
              {!data?.subscriberMetrics.daily.length && !isLoading ? (
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No subscriber activity for this period.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <Card>
          <CardHeader>
            <CardTitle>Most clicked articles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.articleStats || []).map((article) => (
                <div
                  key={article.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-[220px]">
                    <p className="text-sm font-semibold text-foreground">{article.title}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {article.category || "Uncategorized"} · {article.creator || "Unknown"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[color:var(--text-secondary)]">
                    <span className="rounded-full bg-[var(--bg-muted)] px-3 py-1 text-[color:var(--text-secondary)]">
                      {formatNumber(article.clicks)} clicks
                    </span>
                    <span>{article.clickShare.toFixed(1)}%</span>
                    {article.url ? (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[color:var(--accent-primary-dark)]"
                      >
                        View
                      </a>
                    ) : null}
                  </div>
                </div>
              ))}
              {!data?.articleStats.length && !isLoading ? (
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No click activity yet.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent newsletters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(data?.recentNewsletters || []).map((item) => (
              <div key={item.id} className="space-y-1">
                <p className="text-sm font-semibold text-foreground">{item.sequenceName}</p>
                <p className="text-xs text-[color:var(--text-secondary)]">
                  {item.status} · {formatDate(item.sentAt)}
                </p>
              </div>
            ))}
            {!data?.recentNewsletters.length && !isLoading ? (
              <p className="text-sm text-[color:var(--text-secondary)]">
                No newsletters sent in this period.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                Last ingestion
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {data?.systemHealth.lastIngestion
                  ? formatDate(data.systemHealth.lastIngestion.createdAt)
                  : "No runs yet"}
              </p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                {data?.systemHealth.lastIngestion?.message || "Configure ingestion to start."}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                Last distribution
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {data?.systemHealth.lastDistribution
                  ? formatDate(data.systemHealth.lastDistribution.createdAt)
                  : "No sends yet"}
              </p>
              <p className="text-xs text-[color:var(--text-secondary)]">
                {data?.systemHealth.lastDistribution?.message || "Activate a sequence to send."}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
                Active sequences
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatNumber(data?.systemHealth.activeSequences.length || 0)}
              </p>
              <div className="mt-2 space-y-1 text-xs text-[color:var(--text-secondary)]">
                {(data?.systemHealth.activeSequences || []).slice(0, 3).map((sequence) => (
                  <div key={sequence.id}>
                    {sequence.name} · {sequence.time} {sequence.timezone}
                  </div>
                ))}
                {(data?.systemHealth.activeSequences || []).length > 3 ? (
                  <div>+{(data?.systemHealth.activeSequences || []).length - 3} more</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="mt-6 border-t border-[var(--border-default)] pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
              Integrations
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {(data?.systemHealth.integrations || []).map((integration) => (
                <div
                  key={integration.service}
                  className={cn(
                    "rounded-[var(--radius-lg)] border border-[var(--border-default)] px-3 py-2 text-sm",
                    integration.status === "connected"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  )}
                >
                  <p className="font-semibold capitalize">{integration.service}</p>
                  <p className="text-xs">Status: {integration.status}</p>
                  <p className="text-xs">Updated: {formatDate(integration.updatedAt)}</p>
                </div>
              ))}
              {!data?.systemHealth.integrations.length && !isLoading ? (
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No integrations configured.
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
