import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { decryptWithMetadata, encrypt } from "@/lib/encryption"

export const dynamic = "force-dynamic"

const PERIODS: Record<string, { label: string; days: number | null }> = {
  today: { label: "Today", days: 1 },
  "7d": { label: "Last 7 days", days: 7 },
  "30d": { label: "Last 30 days", days: 30 },
  all: { label: "All time", days: null },
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

type ResendContact = {
  id: string
  email: string
  created_at?: string
  updated_at?: string
  unsubscribed?: boolean
}

const fetchResendContactsFromContactsApi = async (apiKey: string) => {
  const contacts: ResendContact[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL("https://api.resend.com/contacts")
    url.searchParams.set("limit", "100")
    if (cursor) {
      url.searchParams.set("cursor", cursor)
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to fetch contacts from Resend:", errorText)
      break
    }

    const data = await response.json()
    const page = (data?.data || []) as ResendContact[]
    contacts.push(...page)

    cursor =
      data?.next ||
      data?.cursor ||
      data?.pagination?.next ||
      data?.links?.next ||
      null
    hasMore = Boolean(cursor && page.length)
  }

  return contacts
}

const fetchResendAudiences = async (apiKey: string) => {
  const response = await fetch("https://api.resend.com/audiences", {
    headers: { Authorization: `Bearer ${apiKey}` },
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error("Failed to fetch audiences from Resend:", errorText)
    return []
  }

  const data = await response.json()
  return data?.data || []
}

const fetchResendContacts = async (apiKey: string, audienceId: string) => {
  const contacts: ResendContact[] = []
  let cursor: string | null = null
  let hasMore = true

  while (hasMore) {
    const url = new URL(`https://api.resend.com/audiences/${audienceId}/contacts`)
    url.searchParams.set("limit", "100")
    if (cursor) {
      url.searchParams.set("cursor", cursor)
    }

    const response = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Failed to fetch contacts from Resend:", errorText)
      break
    }

    const data = await response.json()
    const page = (data?.data || []) as ResendContact[]
    contacts.push(...page)

    cursor =
      data?.next ||
      data?.cursor ||
      data?.pagination?.next ||
      data?.links?.next ||
      null
    hasMore = Boolean(cursor && page.length)
  }

  return contacts
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const periodKey = searchParams.get("period") || "30d"
    const period = PERIODS[periodKey] || PERIODS["30d"]
    const now = new Date()
    const offsetDays =
      period.days === null ? null : Math.max(period.days - 1, 0)
    const start =
      period.days === null
        ? new Date(0)
        : startOfDay(new Date(now.getTime() - (offsetDays as number) * 24 * 60 * 60 * 1000))

    const [
      resendConfig,
      topLinks,
      emailEventCounts,
      recentNewsletters,
      lastIngestion,
      lastDistribution,
      integrations,
      activeSequences,
      scheduleChecks,
      topShortLinks,
    ] = await Promise.all([
      prisma.apiKey.findUnique({ where: { service: "resend" } }),
      prisma.emailEvent.groupBy({
        by: ["clickUrl"],
        where: { eventType: "email.clicked", createdAt: { gte: start }, clickUrl: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { clickUrl: "desc" } },
        take: 10,
      }),
      prisma.emailEvent.groupBy({
        by: ["eventType"],
        where: { createdAt: { gte: start } },
        _count: true,
      }),
      prisma.newsActivity.findMany({
        where: { event: "distribution_completed", createdAt: { gte: start } },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.newsActivity.findFirst({
        where: { event: { startsWith: "ingestion" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.newsActivity.findFirst({
        where: { event: { startsWith: "distribution" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.apiKey.findMany({
        select: { service: true, status: true, updatedAt: true },
      }),
      prisma.sequence.findMany({
        where: { status: "active" },
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, schedule: true, time: true, timezone: true, dayOfWeek: true },
      }),
      prisma.newsActivity.findMany({
        where: { event: "distribution_cron_schedule_check" },
        orderBy: { createdAt: "desc" },
        take: 8,
      }),
      prisma.shortLink.findMany({
        where: { clicks: { gt: 0 } },
        orderBy: { clicks: "desc" },
        take: 10,
        select: { id: true, targetUrl: true, clicks: true, articleId: true },
      }),
    ])

    let activeSubscribers = 0
    let newSubscribers = 0
    let unsubscribed = 0
    const contactsByEmail = new Map<
      string,
      { createdAt: Date | null; updatedAt: Date | null; unsubscribed: boolean }
    >()

    if (resendConfig?.key) {
      const { plaintext, needsRotation } = decryptWithMetadata(resendConfig.key)
      if (needsRotation) {
        await prisma.apiKey.update({
          where: { id: resendConfig.id },
          data: { key: encrypt(plaintext) },
        })
      }
      const apiKey = plaintext
      let allContacts = await fetchResendContactsFromContactsApi(apiKey)
      if (!allContacts.length) {
        const audiences = await fetchResendAudiences(apiKey)
        allContacts = (
          await Promise.all(
            (audiences || []).map((audience: { id: string }) =>
              fetchResendContacts(apiKey, audience.id)
            )
          )
        ).flat()
      }

      allContacts.forEach((contact) => {
        if (!contact?.email) return
        const email = contact.email.toLowerCase()
        const createdAt = contact.created_at ? new Date(contact.created_at) : null
        const updatedAt = contact.updated_at ? new Date(contact.updated_at) : null
        const isUnsubscribed = Boolean(contact.unsubscribed)
        const existing = contactsByEmail.get(email)
        if (!existing) {
          contactsByEmail.set(email, { createdAt, updatedAt, unsubscribed: isUnsubscribed })
          return
        }

        const mergedCreated =
          existing.createdAt && createdAt
            ? (createdAt < existing.createdAt ? createdAt : existing.createdAt)
            : existing.createdAt || createdAt
        const mergedUpdated =
          existing.updatedAt && updatedAt
            ? (updatedAt > existing.updatedAt ? updatedAt : existing.updatedAt)
            : existing.updatedAt || updatedAt

        contactsByEmail.set(email, {
          createdAt: mergedCreated,
          updatedAt: mergedUpdated,
          unsubscribed: existing.unsubscribed || isUnsubscribed,
        })
      })

      contactsByEmail.forEach((contact) => {
        if (contact.unsubscribed) {
          if (contact.updatedAt && contact.updatedAt >= start) {
            unsubscribed += 1
          }
        } else {
          activeSubscribers += 1
        }

        if (contact.createdAt && contact.createdAt >= start) {
          newSubscribers += 1
        }
      })
    }

    const eventCountMap = new Map<string, number>(
      emailEventCounts.map((item) => [item.eventType, item._count])
    )
    const sentCount = eventCountMap.get("email.sent") || 0
    const deliveredCount = eventCountMap.get("email.delivered") || 0
    const openedCount = eventCountMap.get("email.opened") || 0
    const clickedCount = eventCountMap.get("email.clicked") || 0
    const bouncedCount =
      (eventCountMap.get("email.bounced") || 0) +
      (eventCountMap.get("email.failed") || 0)
    const sentBase = sentCount || deliveredCount || openedCount || clickedCount
    const deliveredBase = deliveredCount || openedCount || clickedCount
    const trackingStatus =
      emailEventCounts.length > 0
        ? deliveredBase
          ? "ready"
          : "partial"
        : "unconfigured"

    const totalClicks = clickedCount

    let articleStats = topLinks.map((link) => {
      const clickUrl = link.clickUrl || ""
      const clickCount = link._count._all
      return {
        id: link.clickUrl || "",
        title: clickUrl,
        clicks: clickCount,
        clickShare: totalClicks ? (clickCount / totalClicks) * 100 : 0,
        url: clickUrl,
        category: "",
        creator: "",
      }
    })

    if (!articleStats.length && topShortLinks.length) {
      const articleIds = topShortLinks
        .map((link) => link.articleId)
        .filter(Boolean) as string[]
      const articles = articleIds.length
        ? await prisma.article.findMany({
            where: { id: { in: articleIds } },
            select: { id: true, title: true, category: true, creator: true },
          })
        : []
      const articleMap = new Map(articles.map((article) => [article.id, article]))
      const shortLinkTotalClicks = topShortLinks.reduce((sum, link) => sum + link.clicks, 0)

      articleStats = topShortLinks.map((link) => {
        const article = link.articleId ? articleMap.get(link.articleId) : null
        return {
          id: link.id,
          title: article?.title || link.targetUrl,
          clicks: link.clicks,
          clickShare: shortLinkTotalClicks ? (link.clicks / shortLinkTotalClicks) * 100 : 0,
          url: link.targetUrl,
          category: article?.category || "",
          creator: article?.creator || "",
        }
      })
    }

    const recentNewsletterItems = recentNewsletters.map((item) => {
      const metadata = (item.metadata || {}) as Record<string, unknown>
      return {
        id: item.id,
        sequenceName: (metadata.sequenceName as string) || "Newsletter",
        status: item.status,
        sentAt: item.createdAt,
        broadcastId: (metadata.broadcastId as string) || null,
      }
    })

    const dailyRange = period.days === null ? 30 : period.days
    const dailyStart = startOfDay(new Date(now.getTime() - (dailyRange - 1) * 24 * 60 * 60 * 1000))
    const daily: Array<{ date: string; new: number; unsubscribed: number }> = []
    const chartData: Array<{ date: string; emails: number; openRate: number; clickRate: number }> = []

    for (let dayIndex = 0; dayIndex < dailyRange; dayIndex += 1) {
      const date = new Date(dailyStart)
      date.setDate(dailyStart.getDate() + dayIndex)
      const nextDate = new Date(date)
      nextDate.setDate(date.getDate() + 1)

      const dayNew = Array.from(contactsByEmail.values()).filter((contact) =>
        contact.createdAt && contact.createdAt >= date && contact.createdAt < nextDate
      ).length
      const dayUnsub = Array.from(contactsByEmail.values()).filter((contact) =>
        contact.unsubscribed && contact.updatedAt && contact.updatedAt >= date && contact.updatedAt < nextDate
      ).length

      const dayEmailEvents = await prisma.emailEvent.groupBy({
          by: ["eventType"],
          where: { createdAt: { gte: date, lt: nextDate } },
          _count: true,
        })

      daily.push({
        date: date.toISOString().slice(0, 10),
        new: dayNew,
        unsubscribed: dayUnsub,
      })

      // Build chart data
      const dayEventMap = new Map<string, number>(dayEmailEvents.map((e: { eventType: string; _count: number }) => [e.eventType, e._count]))
      const daySent = dayEventMap.get("email.sent") || 0
      const dayDelivered = dayEventMap.get("email.delivered") || daySent
      const dayOpened = dayEventMap.get("email.opened") || 0
      const dayClicked = dayEventMap.get("email.clicked") || 0

      chartData.push({
        date: date.toISOString().slice(0, 10),
        emails: daySent,
        openRate: dayDelivered ? (dayOpened / dayDelivered) * 100 : 0,
        clickRate: dayDelivered ? (dayClicked / dayDelivered) * 100 : 0,
      })
    }

    // Calculate previous period for trend comparison
    const prevPeriodDays = period.days || 30
    const prevStart = startOfDay(new Date(start.getTime() - prevPeriodDays * 24 * 60 * 60 * 1000))
    const prevNewSubscribers = Array.from(contactsByEmail.values()).filter((contact) =>
      contact.createdAt && contact.createdAt >= prevStart && contact.createdAt < start
    ).length
    const prevUnsubscribed = Array.from(contactsByEmail.values()).filter((contact) =>
      contact.unsubscribed && contact.updatedAt && contact.updatedAt >= prevStart && contact.updatedAt < start
    ).length
    const prevEmailEvents = await prisma.emailEvent.groupBy({
        by: ["eventType"],
        where: { createdAt: { gte: prevStart, lt: start } },
        _count: true,
      })

    const prevEventMap = new Map<string, number>(prevEmailEvents.map((e: { eventType: string; _count: number }) => [e.eventType, e._count]))
    const prevDelivered = prevEventMap.get("email.delivered") || 0
    const prevOpened = prevEventMap.get("email.opened") || 0
    const prevClicked = prevEventMap.get("email.clicked") || 0
    const prevOpenRate = prevDelivered ? (prevOpened / prevDelivered) * 100 : null
    const prevClickRate = prevDelivered ? (prevClicked / prevDelivered) * 100 : null

    // Calculate trends
    const calcTrend = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0
      return ((current - previous) / previous) * 100
    }

    const currentOpenRate = deliveredBase ? (openedCount / deliveredBase) * 100 : null
    const currentClickRate = deliveredBase ? (clickedCount / deliveredBase) * 100 : null

    // Additional metrics
    const [totalArticles, topSequence] = await Promise.all([
      prisma.article.count({ where: { ingestedAt: { gte: start } } }),
      prisma.sequence.findFirst({
        where: { status: "active" },
        orderBy: { lastSent: "desc" },
        select: { name: true },
      }),
    ])

    const avgArticlesPerNewsletter = recentNewsletters.length > 0
      ? totalArticles / recentNewsletters.length
      : 0

    return NextResponse.json({
      period: {
        label: period.label,
        start: start.toISOString(),
        end: now.toISOString(),
      },
      emailMetrics: {
        newslettersSent: recentNewsletters.length,
        totalClicks,
        deliveryRate: sentBase ? (deliveredBase / sentBase) * 100 : null,
        openRate: currentOpenRate,
        clickRate: currentClickRate,
        bounceRate: sentBase ? (bouncedCount / sentBase) * 100 : null,
        unsubscribeRate: deliveredBase ? (unsubscribed / deliveredBase) * 100 : null,
        trackingStatus,
      },
      subscriberMetrics: {
        totalActive: activeSubscribers,
        newSubscribers,
        unsubscribed,
        netGrowth: newSubscribers - unsubscribed,
        daily,
      },
      // New: trends for top metrics
      trends: {
        newSubscribers: {
          value: calcTrend(newSubscribers, prevNewSubscribers),
          direction: newSubscribers >= prevNewSubscribers ? "up" : "down",
        },
        openRate: prevOpenRate !== null && currentOpenRate !== null ? {
          value: currentOpenRate - prevOpenRate,
          direction: currentOpenRate >= prevOpenRate ? "up" : "down",
        } : null,
        clickRate: prevClickRate !== null && currentClickRate !== null ? {
          value: currentClickRate - prevClickRate,
          direction: currentClickRate >= prevClickRate ? "up" : "down",
        } : null,
        unsubscribed: {
          value: calcTrend(unsubscribed, prevUnsubscribed),
          direction: unsubscribed <= prevUnsubscribed ? "up" : "down", // Less unsubscribes is good
        },
      },
      // New: chart data for performance chart
      chartData,
      // New: additional metrics
      additionalMetrics: {
        deliveryRate: sentBase ? (deliveredBase / sentBase) * 100 : null,
        bounceRate: sentBase ? (bouncedCount / sentBase) * 100 : null,
        totalSubscribers: activeSubscribers,
        avgArticlesPerNewsletter,
        newslettersSent: recentNewsletters.length,
        topSequence: topSequence?.name || null,
      },
      articleStats,
      recentNewsletters: recentNewsletterItems,
      systemHealth: {
        lastIngestion: lastIngestion
          ? {
              event: lastIngestion.event,
              status: lastIngestion.status,
              createdAt: lastIngestion.createdAt,
              message: lastIngestion.message,
            }
          : null,
        lastDistribution: lastDistribution
          ? {
              event: lastDistribution.event,
              status: lastDistribution.status,
              createdAt: lastDistribution.createdAt,
              message: lastDistribution.message,
            }
          : null,
        integrations: integrations.map((integration) => ({
          service: integration.service,
          status: integration.status,
          updatedAt: integration.updatedAt,
        })),
        activeSequences,
        scheduleChecks: scheduleChecks.map((check) => ({
          id: check.id,
          createdAt: check.createdAt,
          message: check.message,
          metadata: check.metadata || {},
        })),
      },
    })
  } catch (error) {
    console.error("Failed to fetch analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    )
  }
}
