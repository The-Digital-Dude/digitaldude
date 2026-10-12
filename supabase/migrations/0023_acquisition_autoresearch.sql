-- Migration: 0023_acquisition_autoresearch
-- Daily AI discovery/research support: where a company came from, inert contact
-- suggestions (NOT contacts), and an opt-in switch. Suggestions can never be emailed:
-- only a human accepting one creates an acq_contacts row, which still needs a consent review.

alter table public.acq_companies
  add column if not exists source text not null default 'manual';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'acq_companies_source_check') then
    alter table public.acq_companies add constraint acq_companies_source_check check (source in ('manual','ai_discovery'));
  end if;
end $$;

create table if not exists public.acq_contact_suggestions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.acq_companies(id) on delete cascade,
  email text not null,
  email_normalized text generated always as (lower(btrim(email))) stored,
  name text,
  role text,
  source_url text not null,
  evidence_excerpt text not null,
  status text not null default 'pending' check (status in ('pending','accepted','dismissed')),
  created_at timestamptz not null default now(),
  constraint acq_suggestion_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint acq_suggestion_unique unique (company_id, email_normalized)
);
create index if not exists acq_suggestions_company_idx on public.acq_contact_suggestions (company_id, status);

-- Opt-in: nothing runs automatically until the owner switches it on.
insert into public.acq_settings (key, value) values ('auto_research_enabled', 'false'::jsonb)
on conflict (key) do nothing;

alter table public.acq_contact_suggestions enable row level security;
do $$ declare r text; begin
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on public.acq_contact_suggestions from %I', r);
    end if;
  end loop;
end $$;
