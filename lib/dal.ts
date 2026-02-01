/**
 * Data Access Layer (DAL)
 *
 * Wraps all Supabase queries so the rest of the app uses camelCase objects.
 * Replaces every `prisma.model.method(...)` call in the codebase.
 */

import { supabaseAdmin } from "./supabase"
import { toSnakeCase, toCamelCase, toCamelCaseArray } from "./supabase-utils"

// ─────────────────────────────────────────────
// ApiKey
// ─────────────────────────────────────────────

export async function findApiKeyByService(service: string) {
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .select("*")
    .eq("service", service)
    .single()
  if (error || !data) return null
  return toCamelCase<any>(data)
}

export async function findAllApiKeys() {
  const { data, error } = await supabaseAdmin.from("api_keys").select("*")
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function updateApiKey(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function upsertApiKey(service: string, values: Record<string, any>) {
  const existing = await findApiKeyByService(service)
  if (existing) {
    return updateApiKey(existing.id, values)
  }
  const { data, error } = await supabaseAdmin
    .from("api_keys")
    .insert(toSnakeCase({ service, ...values }))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteApiKey(service: string) {
  const { error } = await supabaseAdmin
    .from("api_keys")
    .delete()
    .eq("service", service)
  if (error) throw error
}

// ─────────────────────────────────────────────
// Article
// ─────────────────────────────────────────────

export async function findRecentArticles(cutoffDate: Date, limit = 20) {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("*")
    .gte("ingested_at", cutoffDate.toISOString())
    .eq("is_recent", true)
    .order("published_date", { ascending: false })
    .limit(limit)
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function upsertArticle(
  canonicalLink: string,
  createData: Record<string, any>,
  updateData: Record<string, any>
) {
  const { data: existing } = await supabaseAdmin
    .from("articles")
    .select("id")
    .eq("canonical_link", canonicalLink)
    .maybeSingle()

  if (existing) {
    const { error } = await supabaseAdmin
      .from("articles")
      .update(toSnakeCase(updateData))
      .eq("canonical_link", canonicalLink)
    if (error) throw error
    return { created: false }
  } else {
    const { error } = await supabaseAdmin
      .from("articles")
      .insert(toSnakeCase(createData))
    if (error) throw error
    return { created: true }
  }
}

export async function countArticles() {
  const { count, error } = await supabaseAdmin
    .from("articles")
    .select("*", { count: "exact", head: true })
  if (error) throw error
  return count || 0
}

export async function findAllArticleLinks() {
  const { data, error } = await supabaseAdmin
    .from("articles")
    .select("source_link, image_link")
    .neq("source_link", "")
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function updateArticlesRecency(cutoffDate: Date) {
  const { error } = await supabaseAdmin
    .from("articles")
    .update({ is_recent: false })
    .lt("ingested_at", cutoffDate.toISOString())
    .eq("is_recent", true)
  if (error) throw error
}

// ─────────────────────────────────────────────
// Sequence
// ─────────────────────────────────────────────

export async function findAllSequences(orderBy = "created_at", ascending = false) {
  const { data, error } = await supabaseAdmin
    .from("sequences")
    .select("*")
    .order(orderBy, { ascending })
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findActiveSequences() {
  const { data, error } = await supabaseAdmin
    .from("sequences")
    .select("*")
    .eq("status", "active")
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findSequenceById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("sequences")
    .select("*")
    .eq("id", id)
    .single()
  if (error || !data) return null
  return toCamelCase<any>(data)
}

export async function createSequence(sequenceData: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("sequences")
    .insert(toSnakeCase(sequenceData))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateSequence(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("sequences")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteSequence(id: string) {
  const { error } = await supabaseAdmin.from("sequences").delete().eq("id", id)
  if (error) throw error
}

// ─────────────────────────────────────────────
// RssSource
// ─────────────────────────────────────────────

export async function findAllRssSources(orderBy = "created_at", ascending = false) {
  const { data, error } = await supabaseAdmin
    .from("rss_sources")
    .select("*")
    .order(orderBy, { ascending })
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findEnabledRssSources() {
  const { data, error } = await supabaseAdmin
    .from("rss_sources")
    .select("*")
    .eq("enabled", true)
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findRssSourceById(id: string) {
  const { data, error } = await supabaseAdmin
    .from("rss_sources")
    .select("*")
    .eq("id", id)
    .single()
  if (error || !data) return null
  return toCamelCase<any>(data)
}

export async function createRssSource(source: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("rss_sources")
    .insert(toSnakeCase(source))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateRssSource(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("rss_sources")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteRssSource(id: string) {
  const { error } = await supabaseAdmin.from("rss_sources").delete().eq("id", id)
  if (error) throw error
}

export async function upsertRssSource(url: string, values: Record<string, any>) {
  const { data: existing } = await supabaseAdmin
    .from("rss_sources")
    .select("id")
    .eq("url", url)
    .maybeSingle()

  if (existing) {
    return updateRssSource(existing.id, values)
  }
  return createRssSource({ url, ...values })
}

export async function findAllRssSourceUrls() {
  const { data, error } = await supabaseAdmin
    .from("rss_sources")
    .select("url")
  if (error) throw error
  return (data || []).map((r: any) => r.url)
}

// ─────────────────────────────────────────────
// ShortLink
// ─────────────────────────────────────────────

export async function findShortLinkByTarget(
  targetUrl: string,
  articleId: string | null | undefined,
  sequenceId: string | null | undefined
) {
  let query = supabaseAdmin
    .from("short_links")
    .select("*")
    .eq("target_url", targetUrl)

  if (articleId) query = query.eq("article_id", articleId)
  else query = query.is("article_id", null)

  if (sequenceId) query = query.eq("sequence_id", sequenceId)
  else query = query.is("sequence_id", null)

  const { data } = await query.limit(1).maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function findShortLinkByCode(shortCode: string) {
  const { data } = await supabaseAdmin
    .from("short_links")
    .select("*")
    .eq("short_code", shortCode)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function createShortLinkRecord(record: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("short_links")
    .insert(toSnakeCase(record))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function incrementShortLinkClicks(id: string) {
  // Use RPC or manual increment
  const { data: current } = await supabaseAdmin
    .from("short_links")
    .select("clicks")
    .eq("id", id)
    .single()
  if (!current) return
  const { error } = await supabaseAdmin
    .from("short_links")
    .update({ clicks: (current.clicks || 0) + 1 })
    .eq("id", id)
  if (error) throw error
}

export async function aggregateShortLinks(sequenceId?: string) {
  let query = supabaseAdmin.from("short_links").select("clicks")
  if (sequenceId) query = query.eq("sequence_id", sequenceId)
  const { data, error } = await query
  if (error) throw error
  const totalLinks = data?.length || 0
  const totalClicks = data?.reduce((sum: number, row: any) => sum + (row.clicks || 0), 0) || 0
  return { totalLinks, totalClicks }
}

export async function findAllShortLinkTargets() {
  const { data, error } = await supabaseAdmin
    .from("short_links")
    .select("target_url")
  if (error) throw error
  return (data || []).map((r: any) => r.target_url)
}

// ─────────────────────────────────────────────
// NewsActivity
// ─────────────────────────────────────────────

export async function createNewsActivity(activity: Record<string, any>) {
  const { error } = await supabaseAdmin
    .from("news_activity")
    .insert(toSnakeCase(activity))
  if (error) console.error("Failed to write news activity:", error)
}

export async function findNewsActivity(limit = 100) {
  const { data, error } = await supabaseAdmin
    .from("news_activity")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

// ─────────────────────────────────────────────
// NewsletterTemplate
// ─────────────────────────────────────────────

export async function findAllNewsletterTemplates(orderBy = "created_at", ascending = false) {
  const { data, error } = await supabaseAdmin
    .from("newsletter_templates")
    .select("*")
    .order(orderBy, { ascending })
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findNewsletterTemplateById(id: string) {
  const { data } = await supabaseAdmin
    .from("newsletter_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function findDefaultNewsletterTemplate() {
  const { data } = await supabaseAdmin
    .from("newsletter_templates")
    .select("*")
    .eq("is_default", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function createNewsletterTemplate(template: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("newsletter_templates")
    .insert(toSnakeCase(template))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateNewsletterTemplate(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("newsletter_templates")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteNewsletterTemplate(id: string) {
  const { error } = await supabaseAdmin.from("newsletter_templates").delete().eq("id", id)
  if (error) throw error
}

// ─────────────────────────────────────────────
// EmailTemplate
// ─────────────────────────────────────────────

export async function findEmailTemplateByType(type: string) {
  const { data } = await supabaseAdmin
    .from("email_templates")
    .select("*")
    .eq("type", type)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function upsertEmailTemplate(type: string, values: Record<string, any>) {
  const existing = await findEmailTemplateByType(type)
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("email_templates")
      .update(toSnakeCase(values))
      .eq("type", type)
      .select()
      .single()
    if (error) throw error
    return toCamelCase<any>(data)
  }
  const { data, error } = await supabaseAdmin
    .from("email_templates")
    .insert(toSnakeCase({ type, ...values }))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

// ─────────────────────────────────────────────
// IngestionConfig
// ─────────────────────────────────────────────

export async function findIngestionConfig() {
  const { data } = await supabaseAdmin
    .from("ingestion_configs")
    .select("*")
    .limit(1)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function updateIngestionConfig(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("ingestion_configs")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function upsertIngestionConfig(values: Record<string, any>) {
  const existing = await findIngestionConfig()
  if (existing) {
    return updateIngestionConfig(existing.id, values)
  }
  const { data, error } = await supabaseAdmin
    .from("ingestion_configs")
    .insert(toSnakeCase(values))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

// ─────────────────────────────────────────────
// SequencePromptConfig
// ─────────────────────────────────────────────

export async function findSequencePromptConfig() {
  const { data } = await supabaseAdmin
    .from("sequence_prompt_configs")
    .select("*")
    .limit(1)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function upsertSequencePromptConfig(values: Record<string, any>) {
  const existing = await findSequencePromptConfig()
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from("sequence_prompt_configs")
      .update(toSnakeCase(values))
      .eq("id", existing.id)
      .select()
      .single()
    if (error) throw error
    return toCamelCase<any>(data)
  }
  const { data, error } = await supabaseAdmin
    .from("sequence_prompt_configs")
    .insert(toSnakeCase(values))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

// ─────────────────────────────────────────────
// Subscriber
// ─────────────────────────────────────────────

export async function findSubscriberByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from("subscribers")
    .select("*")
    .eq("email", email)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function findAllSubscribers() {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function createSubscriber(sub: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .insert(toSnakeCase(sub))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateSubscriber(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateSubscriberByEmail(email: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("subscribers")
    .update(toSnakeCase(updates))
    .eq("email", email)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function upsertSubscriber(email: string, values: Record<string, any>) {
  const existing = await findSubscriberByEmail(email)
  if (existing) {
    return updateSubscriber(existing.id, values)
  }
  return createSubscriber({ email, ...values })
}

export async function countSubscribers(where?: Record<string, any>) {
  let query = supabaseAdmin.from("subscribers").select("*", { count: "exact", head: true })
  if (where) {
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value)
    }
  }
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

// ─────────────────────────────────────────────
// PushSubscription
// ─────────────────────────────────────────────

export async function upsertPushSubscriptionRecord(sub: {
  endpoint: string
  p256dh: string
  auth: string
  userAgent?: string | null
}) {
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .upsert(toSnakeCase(sub), { onConflict: "endpoint" })
  if (error) throw error
}

export async function deletePushSubscriptionByEndpoint(endpoint: string) {
  const { error } = await supabaseAdmin
    .from("push_subscriptions")
    .delete()
    .eq("endpoint", endpoint)
  if (error) throw error
}

export async function findAllPushSubscriptions() {
  const { data, error } = await supabaseAdmin
    .from("push_subscriptions")
    .select("*")
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

// ─────────────────────────────────────────────
// EmailEvent
// ─────────────────────────────────────────────

export async function upsertEmailEvent(eventId: string | null, eventData: Record<string, any>) {
  if (eventId) {
    const { error } = await supabaseAdmin
      .from("email_events")
      .upsert(toSnakeCase({ ...eventData, eventId }), { onConflict: "event_id" })
    if (error) throw error
  } else {
    const { error } = await supabaseAdmin
      .from("email_events")
      .insert(toSnakeCase(eventData))
    if (error) throw error
  }
}

export async function findEmailEvents(limit = 100, filters?: Record<string, any>) {
  let query = supabaseAdmin
    .from("email_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit)
  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      query = query.eq(key, value)
    }
  }
  const { data, error } = await query
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function countEmailEvents(where?: Record<string, any>) {
  let query = supabaseAdmin.from("email_events").select("*", { count: "exact", head: true })
  if (where) {
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value)
    }
  }
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

// ─────────────────────────────────────────────
// DataSource
// ─────────────────────────────────────────────

export async function findAllDataSources() {
  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findDataSourceById(id: string) {
  const { data } = await supabaseAdmin
    .from("data_sources")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function createDataSource(source: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .insert(toSnakeCase(source))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateDataSource(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("data_sources")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteDataSource(id: string) {
  const { error } = await supabaseAdmin.from("data_sources").delete().eq("id", id)
  if (error) throw error
}

// ─────────────────────────────────────────────
// NewsletterComponent
// ─────────────────────────────────────────────

export async function findAllNewsletterComponents() {
  const { data, error } = await supabaseAdmin
    .from("newsletter_components")
    .select("*, data_sources(*)")
    .order("created_at", { ascending: false })
  if (error) throw error
  return (data || []).map((row: any) => {
    const component = toCamelCase<any>(row)
    if (row.data_sources) {
      component.dataSource = toCamelCase(row.data_sources)
    }
    return component
  })
}

export async function findNewsletterComponentById(id: string) {
  const { data } = await supabaseAdmin
    .from("newsletter_components")
    .select("*, data_sources(*)")
    .eq("id", id)
    .maybeSingle()
  if (!data) return null
  const component = toCamelCase<any>(data)
  if (data.data_sources) {
    component.dataSource = toCamelCase(data.data_sources)
  }
  return component
}

export async function createNewsletterComponent(component: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("newsletter_components")
    .insert(toSnakeCase(component))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateNewsletterComponent(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("newsletter_components")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteNewsletterComponent(id: string) {
  const { error } = await supabaseAdmin.from("newsletter_components").delete().eq("id", id)
  if (error) throw error
}

// ─────────────────────────────────────────────
// SavedContent
// ─────────────────────────────────────────────

export async function findSavedContent(filters?: { type?: string; used?: boolean }) {
  let query = supabaseAdmin
    .from("saved_content")
    .select("*")
    .order("created_at", { ascending: false })
  if (filters?.type) query = query.eq("type", filters.type)
  if (filters?.used !== undefined) query = query.eq("used", filters.used)
  const { data, error } = await query
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findSavedContentById(id: string) {
  const { data } = await supabaseAdmin
    .from("saved_content")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function findSavedContentByIds(ids: string[]) {
  if (ids.length === 0) return []
  const { data, error } = await supabaseAdmin
    .from("saved_content")
    .select("*")
    .in("id", ids)
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function createSavedContent(content: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("saved_content")
    .insert(toSnakeCase(content))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateSavedContent(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("saved_content")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteSavedContent(id: string) {
  const { error } = await supabaseAdmin.from("saved_content").delete().eq("id", id)
  if (error) throw error
}

// ─────────────────────────────────────────────
// WeeklyNewsletter
// ─────────────────────────────────────────────

export async function findAllWeeklyNewsletters() {
  const { data, error } = await supabaseAdmin
    .from("weekly_newsletters")
    .select("*")
    .order("week_start", { ascending: false })
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function findWeeklyNewsletterById(id: string) {
  const { data } = await supabaseAdmin
    .from("weekly_newsletters")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function createWeeklyNewsletter(newsletter: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("weekly_newsletters")
    .insert(toSnakeCase(newsletter))
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function updateWeeklyNewsletter(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("weekly_newsletters")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteWeeklyNewsletter(id: string) {
  const { error } = await supabaseAdmin.from("weekly_newsletters").delete().eq("id", id)
  if (error) throw error
}

// ─────────────────────────────────────────────
// User / Profile (for auth migration - Phase 4)
// ─────────────────────────────────────────────

export async function findProfileByEmail(email: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("email", email)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function findProfileById(id: string) {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle()
  return data ? toCamelCase<any>(data) : null
}

export async function findAllProfiles() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
  if (error) throw error
  return toCamelCaseArray<any>(data || [])
}

export async function updateProfile(id: string, updates: Record<string, any>) {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .update(toSnakeCase(updates))
    .eq("id", id)
    .select()
    .single()
  if (error) throw error
  return toCamelCase<any>(data)
}

export async function deleteProfile(id: string) {
  const { error } = await supabaseAdmin.from("profiles").delete().eq("id", id)
  if (error) throw error
}
