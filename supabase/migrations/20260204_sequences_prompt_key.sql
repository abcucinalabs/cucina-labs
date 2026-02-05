-- Add prompt_key column to sequences table
alter table public.sequences
  add column if not exists prompt_key text not null default 'daily_insights';
