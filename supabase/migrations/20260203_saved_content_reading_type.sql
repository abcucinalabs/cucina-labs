-- Migrate saved_content type values from legacy "recipe" to "reading"
-- and enforce allowed values for future writes.

update public.saved_content
set type = 'reading'
where type = 'recipe';

update public.saved_content
set type = 'reading'
where type not in ('reading', 'cooking');

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'saved_content_type_check'
      and conrelid = 'public.saved_content'::regclass
  ) then
    alter table public.saved_content
      add constraint saved_content_type_check
      check (type in ('reading', 'cooking'));
  end if;
end;
$$;
