-- Supabase Schema for cucina-labs
-- Run this in the Supabase SQL editor to create all tables.
-- Auth users are managed by Supabase Auth (auth.users).

-- ============================================================
-- PROFILES (extends auth.users with role)
-- ============================================================
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- API KEYS (encrypted service credentials)
-- ============================================================
create table if not exists public.api_keys (
  id text primary key default gen_random_uuid()::text,
  service text unique not null,
  key text not null,
  status text not null default 'disconnected',
  gemini_model text default 'gemini-2.5-flash-preview-05-20',
  resend_from_name text default 'Adrian & Jimmy from "AI Product Briefing"',
  resend_from_email text default 'hello@jimmy-iliohan.com',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- RSS SOURCES
-- ============================================================
create table if not exists public.rss_sources (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  url text unique not null,
  category text,
  enabled boolean not null default true,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- ARTICLES
-- ============================================================
create table if not exists public.articles (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null,
  creator text not null,
  ai_summary text not null,
  why_it_matters text not null,
  business_value text not null,
  published_date timestamptz not null,
  source_link text not null,
  canonical_link text unique not null,
  image_link text,
  ingested_at timestamptz not null default now(),
  days_since_published int not null,
  is_recent boolean not null default true
);

-- ============================================================
-- SEQUENCES (automated newsletter schedules)
-- ============================================================
create table if not exists public.sequences (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  audience_id text not null,
  schedule text not null,
  day_of_week text[] not null default '{}',
  time text not null,
  timezone text not null default 'UTC',
  system_prompt text,
  user_prompt text,
  template_id text,
  topic_id text,
  content_sources text[] not null default '{}',
  layout jsonb,
  status text not null default 'draft',
  last_sent timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIBERS
-- ============================================================
create table if not exists public.subscribers (
  id text primary key default gen_random_uuid()::text,
  email text unique not null,
  status text not null default 'active',
  daily_enabled boolean not null default true,
  weekly_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- NEWSLETTER TEMPLATES
-- ============================================================
create table if not exists public.newsletter_templates (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  html text not null,
  is_default boolean not null default false,
  include_footer boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- EMAIL TEMPLATES
-- ============================================================
create table if not exists public.email_templates (
  id text primary key default gen_random_uuid()::text,
  type text unique not null,
  subject text,
  html text not null,
  enabled boolean not null default true,
  template_id text references public.newsletter_templates(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- INGESTION CONFIG
-- ============================================================
create table if not exists public.ingestion_configs (
  id text primary key default gen_random_uuid()::text,
  schedule text[] not null default '{}',
  time text not null default '09:00',
  timezone text not null default 'America/New_York',
  time_frame int not null default 72,
  system_prompt text not null,
  user_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- NEWS ACTIVITY (audit log)
-- ============================================================
create table if not exists public.news_activity (
  id text primary key default gen_random_uuid()::text,
  event text not null,
  status text not null default 'info',
  message text not null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- SEQUENCE PROMPT CONFIG (global AI prompt defaults)
-- ============================================================
create table if not exists public.sequence_prompt_configs (
  id text primary key default gen_random_uuid()::text,
  system_prompt text not null,
  user_prompt text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SHORT LINKS (URL tracking)
-- ============================================================
create table if not exists public.short_links (
  id text primary key default gen_random_uuid()::text,
  short_code text unique not null,
  target_url text not null,
  article_id text,
  sequence_id text,
  clicks int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_short_links_short_code on public.short_links(short_code);
create index if not exists idx_short_links_article_id on public.short_links(article_id);
create index if not exists idx_short_links_sequence_id on public.short_links(sequence_id);

-- ============================================================
-- EMAIL EVENTS (Resend webhook events)
-- ============================================================
create table if not exists public.email_events (
  id text primary key default gen_random_uuid()::text,
  event_id text unique,
  event_type text not null,
  email_id text,
  broadcast_id text,
  recipient text,
  subject text,
  click_url text,
  payload jsonb,
  created_at timestamptz not null default now()
);
create index if not exists idx_email_events_event_type on public.email_events(event_type);
create index if not exists idx_email_events_email_id on public.email_events(email_id);
create index if not exists idx_email_events_broadcast_id on public.email_events(broadcast_id);
create index if not exists idx_email_events_created_at on public.email_events(created_at);

-- ============================================================
-- PUSH SUBSCRIPTIONS
-- ============================================================
create table if not exists public.push_subscriptions (
  id text primary key default gen_random_uuid()::text,
  endpoint text unique not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- DATA SOURCES
-- ============================================================
create table if not exists public.data_sources (
  id text primary key default gen_random_uuid()::text,
  name text unique not null,
  type text not null,
  table_id text,
  table_name text,
  view_id text,
  view_name text,
  field_mapping jsonb,
  sync_status text not null default 'idle',
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- NEWSLETTER COMPONENTS
-- ============================================================
create table if not exists public.newsletter_components (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text,
  type text not null,
  data_source_id text references public.data_sources(id),
  display_options jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- SAVED CONTENT
-- ============================================================
create table if not exists public.saved_content (
  id text primary key default gen_random_uuid()::text,
  type text not null,
  title text not null,
  url text,
  description text,
  image_url text,
  source text,
  notes text,
  used boolean not null default false,
  used_in_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_saved_content_type on public.saved_content(type);
create index if not exists idx_saved_content_used on public.saved_content(used);
create index if not exists idx_saved_content_created_at on public.saved_content(created_at);

-- ============================================================
-- WEEKLY NEWSLETTERS
-- ============================================================
create table if not exists public.weekly_newsletters (
  id text primary key default gen_random_uuid()::text,
  week_start timestamptz not null,
  week_end timestamptz not null,
  status text not null default 'draft',
  chefs_table_title text,
  chefs_table_body text,
  news_items jsonb,
  recipe_ids text[] not null default '{}',
  cooking_items jsonb,
  system_prompt text,
  generated_at timestamptz,
  audience_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_weekly_newsletters_week_start on public.weekly_newsletters(week_start);
create index if not exists idx_weekly_newsletters_status on public.weekly_newsletters(status);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles', 'api_keys', 'rss_sources', 'sequences', 'subscribers',
      'newsletter_templates', 'email_templates', 'ingestion_configs',
      'sequence_prompt_configs', 'short_links', 'push_subscriptions',
      'data_sources', 'newsletter_components', 'saved_content', 'weekly_newsletters'
    ])
  loop
    execute format(
      'drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute function public.handle_updated_at();',
      t, t
    );
  end loop;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles', 'api_keys', 'rss_sources', 'articles', 'sequences',
      'subscribers', 'newsletter_templates', 'email_templates',
      'ingestion_configs', 'news_activity', 'sequence_prompt_configs',
      'short_links', 'email_events', 'push_subscriptions',
      'data_sources', 'newsletter_components', 'saved_content', 'weekly_newsletters'
    ])
  loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'drop policy if exists "Authenticated full access" on public.%I; create policy "Authenticated full access" on public.%I for all using (auth.role() = ''authenticated'');',
      t, t
    );
  end loop;
end;
$$;

-- Public insert policies for unauthenticated endpoints
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Anyone can subscribe' and tablename = 'subscribers') then
    create policy "Anyone can subscribe" on public.subscribers for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Webhook can insert email events' and tablename = 'email_events') then
    create policy "Webhook can insert email events" on public.email_events for insert with check (true);
  end if;
  if not exists (select 1 from pg_policies where policyname = 'Anyone can create push subscription' and tablename = 'push_subscriptions') then
    create policy "Anyone can create push subscription" on public.push_subscriptions for insert with check (true);
  end if;
end;
$$;

-- Auto-create profile on auth user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, new.email, 'admin');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
