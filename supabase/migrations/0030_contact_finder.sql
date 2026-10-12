-- Migration: 0030_contact_finder
-- P4: contact-finder (Hunter.io) results arrive as inert suggestions, like website-found addresses.
-- Records where a suggestion came from and how confident the source was, and when a company was last
-- looked up so the same company isn't paid for twice. Requires 0023.

alter table public.acq_contact_suggestions
  add column if not exists origin text not null default 'website',
  add column if not exists confidence integer;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'acq_suggestions_origin_check') then
    alter table public.acq_contact_suggestions add constraint acq_suggestions_origin_check check (origin in ('website','hunter'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'acq_suggestions_confidence_check') then
    alter table public.acq_contact_suggestions add constraint acq_suggestions_confidence_check check (confidence is null or confidence between 0 and 100);
  end if;
end $$;

alter table public.acq_companies add column if not exists contacts_looked_up_at timestamptz;
