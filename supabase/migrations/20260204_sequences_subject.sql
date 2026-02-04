-- Add a per-sequence subject override for scheduled and manual sends.
alter table if exists public.sequences
  add column if not exists subject text;
