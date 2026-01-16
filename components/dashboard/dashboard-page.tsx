"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MetricCard } from "@/components/dashboard/metric-card"
import { PerformanceChart, type ChartDataPoint, type MetricKey } from "@/components/dashboard/performance-chart"
import { ToggleButton } from "@/components/dashboard/toggle-button"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

type TrendData = {
  value: number
  direction: "up" | "down"
} | null

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
  trends: {
    newSubscribers: TrendData
    openRate: TrendData
    clickRate: TrendData
    unsubscribed: TrendData
  }
  chartData: ChartDataPoint[]
  additionalMetrics: {
    deliveryRate: number | null
    bounceRate: number | null
    totalSubscribers: number
    avgArticlesPerNewsletter: number
    newslettersSent: number
    topSequence: string | null
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
    scheduleChecks: Array<{
      id: string
      createdAt: string
      message: string | null
      metadata: {
        sequenceName?: string
        localTime?: string
        shouldRun?: boolean
        schedule?: string
        timezone?: string
      }
    }>
  }
}

const PERIOD_OPTIONS = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "all", label: "All time" },
]

const METRIC_COLORS: Record<MetricKey, string> = {
  emails: "#3c35f2",
  openRate: "#9bf2ca",
  clickRate: "#f59e0b",
}

const formatNumber = (value: number) => value.toLocaleString()

const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) return "—"
  return `${value.toFixed(1)}%`
}

const formatTrend = (trend: TrendData, isPercent = false) => {
  if (!trend) return undefined
  const sign = trend.value >= 0 ? "+" : ""
  return isPercent ? `${sign}${trend.value.toFixed(1)}pp` : `${sign}${trend.value.toFixed(0)}%`
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
  const [period, setPeriod] = useState("7d")
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(["emails", "openRate", "clickRate"])
  const isMountedRef = useRef(true)

  const loadData = useCallback(async (selectedPeriod: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/analytics?period=${selectedPeriod}`, {
        cache: "no-store",
      })
      if (!response.ok) {
        throw new Error("Failed to load dashboard data")
      }
      const payload = (await response.json()) as DashboardData
      if (isMountedRef.current) {
        setData(payload)
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data")
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [])

  const toggleMetric = (metric: MetricKey) => {
    setSelectedMetrics((prev) =>
      prev.includes(metric)
        ? prev.filter((m) => m !== metric)
        : [...prev, metric]
    )
  }

  useEffect(() => {
    isMountedRef.current = true
    loadData(period)
    return () => {
      isMountedRef.current = false
    }
  }, [loadData, period])

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
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold" style={{ color: "#0d0d0d" }}>Dashboard</h1>
          <p className="text-[color:var(--text-secondary)] mt-2">
            Monitor performance, engagement, and system health at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <Button
            variant="outline"
            size="icon"
            onClick={() => loadData(period)}
            disabled={isLoading}
            aria-label="Refresh dashboard"
            title="Refresh dashboard"
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {error ? (
        <Card>
          <CardContent className="p-6 text-sm text-[color:var(--text-secondary)]">
            {error}
          </CardContent>
        </Card>
      ) : null}

      {/* TOP ROW - 4 KEY METRICS with trends */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="New Subscribers"
          value={data ? formatNumber(data.subscriberMetrics.newSubscribers) : "—"}
          helper={data ? data.period.label : "Loading"}
          trend={formatTrend(data?.trends.newSubscribers ?? null)}
          trendDirection={data?.trends.newSubscribers?.direction}
        />
        <MetricCard
          label="Open Rate"
          value={data ? formatPercent(data.emailMetrics.openRate) : "—"}
          helper={data ? data.period.label : "Loading"}
          trend={formatTrend(data?.trends.openRate ?? null, true)}
          trendDirection={data?.trends.openRate?.direction}
          accent="text-[#3c35f2]"
        />
        <MetricCard
          label="Click Rate"
          value={data ? formatPercent(data.emailMetrics.clickRate) : "—"}
          helper={data ? data.period.label : "Loading"}
          trend={formatTrend(data?.trends.clickRate ?? null, true)}
          trendDirection={data?.trends.clickRate?.direction}
          accent="text-[#3c35f2]"
        />
        <MetricCard
          label="Unsubscribes"
          value={data ? formatNumber(data.subscriberMetrics.unsubscribed) : "—"}
          helper={data ? data.period.label : "Loading"}
          trend={formatTrend(data?.trends.unsubscribed ?? null)}
          trendDirection={data?.trends.unsubscribed?.direction}
        />
      </div>

      {/* PERFORMANCE CHART */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <CardTitle>Performance</CardTitle>
            <div className="flex flex-wrap gap-2">
              <ToggleButton
                active={selectedMetrics.includes("emails")}
                onClick={() => toggleMetric("emails")}
                color={METRIC_COLORS.emails}
              >
                Total Emails
              </ToggleButton>
              <ToggleButton
                active={selectedMetrics.includes("openRate")}
                onClick={() => toggleMetric("openRate")}
                color={METRIC_COLORS.openRate}
              >
                Open Rate
              </ToggleButton>
              <ToggleButton
                active={selectedMetrics.includes("clickRate")}
                onClick={() => toggleMetric("clickRate")}
                color={METRIC_COLORS.clickRate}
              >
                Click Rate
              </ToggleButton>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PerformanceChart
            data={data?.chartData || []}
            selectedMetrics={selectedMetrics}
          />
        </CardContent>
      </Card>

      {/* POPULAR ARTICLES */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Popular Articles</CardTitle>
            <a href="#" className="text-sm font-semibold" style={{ color: "#3c35f2" }}>
              See all
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(data?.articleStats || []).map((article, index) => (
              <div
                key={article.id}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3 min-w-[220px]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold" style={{ backgroundColor: "#9bf2ca", color: "#0d0d0d" }}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{article.title}</p>
                    <p className="text-xs text-[color:var(--text-secondary)]">
                      {article.category || "Uncategorized"} · {article.creator || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-[color:var(--text-secondary)]">
                  <span className="rounded-full px-3 py-1" style={{ backgroundColor: "rgba(60, 53, 242, 0.1)", color: "#3c35f2" }}>
                    {formatNumber(article.clicks)} clicks
                  </span>
                  <span>{article.clickShare.toFixed(1)}%</span>
                  {article.url ? (
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#3c35f2" }}
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

      {/* ADDITIONAL METRICS SECTION */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          label="Delivery Rate"
          value={formatPercent(data?.additionalMetrics.deliveryRate ?? null)}
          helper="Successful deliveries"
          accent="text-emerald-600"
        />
        <MetricCard
          label="Bounce Rate"
          value={formatPercent(data?.additionalMetrics.bounceRate ?? null)}
          helper="Failed deliveries"
          accent={data?.additionalMetrics.bounceRate && data.additionalMetrics.bounceRate > 5 ? "text-rose-500" : "text-foreground"}
        />
        <MetricCard
          label="Total Subscribers"
          value={data ? formatNumber(data.additionalMetrics.totalSubscribers) : "—"}
          helper="Active subscribers"
        />
        <MetricCard
          label="Avg. Articles/Newsletter"
          value={data ? data.additionalMetrics.avgArticlesPerNewsletter.toFixed(1) : "—"}
          helper="This period"
        />
        <MetricCard
          label="Newsletters Sent"
          value={data ? formatNumber(data.additionalMetrics.newslettersSent) : "—"}
          helper="This period"
        />
        <MetricCard
          label="Top Sequence"
          value={data?.additionalMetrics.topSequence || "—"}
          helper="Most recently active"
          accent="text-[#3c35f2]"
        />
      </div>

      {/* SUBSCRIBER GROWTH */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Subscriber Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(data?.subscriberMetrics.daily || []).slice(-10).map((entry) => {
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
                          className="h-2 rounded-full"
                          style={{ width: `${newWidth}%`, backgroundColor: "#9bf2ca" }}
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

        <Card>
          <CardHeader>
            <CardTitle>Recent Newsletters</CardTitle>
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

      {/* SYSTEM HEALTH */}
      <Card>
        <CardHeader>
          <CardTitle>System Health</CardTitle>
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

          <div className="mt-6 border-t border-[var(--border-default)] pt-5">
            <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--text-muted)]">
              Schedule checks
            </p>
            <div className="mt-3 space-y-2 text-xs text-[color:var(--text-secondary)]">
              {(data?.systemHealth.scheduleChecks || []).map((check) => (
                <div key={check.id} className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {check.metadata.sequenceName || "Unknown sequence"}
                  </span>
                  <span>·</span>
                  <span>{check.metadata.localTime || "Unknown time"}</span>
                  <span>·</span>
                  <span>{check.metadata.shouldRun ? "scheduled" : "not scheduled"}</span>
                  <span>·</span>
                  <span>{formatDate(check.createdAt)}</span>
                </div>
              ))}
              {!data?.systemHealth.scheduleChecks.length && !isLoading ? (
                <p className="text-sm text-[color:var(--text-secondary)]">
                  No schedule checks logged yet.
                </p>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
