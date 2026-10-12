-- Migration: 0029_rep_pool
-- P3: reps work the pool. Links rep leads to pool contacts, records who reviewed consent, company notes,
-- and one function that decides whether a given rep may email a given pool contact.
-- Requires 0022, 0026, 0027 and the existing rep_leads table (skipped safely if absent).

-- A pool contact the rep has been cleared to email becomes a normal rep lead, so the existing drips,
-- templates and outreach tools work on it unchanged.
do $$ begin
  if to_regclass('public.rep_leads') is not null then
    alter table public.rep_leads add column if not exists acq_contact_id uuid references public.acq_contacts(id) on delete set null;
    create unique index if not exists rep_leads_employee_contact_uq on public.rep_leads (employee_id, acq_contact_id) where acq_contact_id is not null;
  end if;
end $$;

-- Who recorded a lawful-basis review (a rep, not just a name string) for the admin audit trail.
alter table public.acq_consent_records add column if not exists reviewed_by_employee_id uuid;

create table if not exists public.acq_company_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.acq_companies(id) on delete cascade,
  employee_id uuid,
  author text not null,
  note text not null check (btrim(note) <> '' and length(note) <= 4000),
  created_at timestamptz not null default now()
);
create index if not exists acq_company_notes_company_idx on public.acq_company_notes (company_id, created_at desc);

-- May this rep email this contact? Every condition must hold, checked at send time:
-- the rep owns the contact's company, the contact is eligible with a valid recorded basis,
-- the address is not suppressed, and the company's country has an enabled email rule.
create or replace function public.acq_rep_can_email(p_contact_id uuid, p_employee uuid)
returns table (ok boolean, reason text) language plpgsql stable as $$
declare ct public.acq_contacts; co public.acq_companies;
begin
  select * into ct from public.acq_contacts where id = p_contact_id;
  if ct.id is null then return query select false, 'contact_not_found'; return; end if;
  select * into co from public.acq_companies where id = ct.company_id;
  if co.id is null then return query select false, 'no_company'; return; end if;
  if co.owner_employee_id is distinct from p_employee then return query select false, 'not_your_company'; return; end if;
  if co.status = 'archived' then return query select false, 'company_archived'; return; end if;
  if ct.status <> 'eligible' then return query select false, 'contact_not_eligible'; return; end if;
  if public.acq_is_suppressed(ct.email) then return query select false, 'suppressed'; return; end if;
  if not public.acq_contact_consent_ok(ct.id) then return query select false, 'consent_invalid'; return; end if;
  if not public.acq_country_allowed(co.country) then return query select false, 'country_blocked'; return; end if;
  return query select true, null::text;
end $$;

-- RLS: no policies; service role only.
do $$
declare r text;
begin
  alter table public.acq_company_notes enable row level security;
  revoke execute on function public.acq_rep_can_email(uuid,uuid) from public;
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on public.acq_company_notes from %I', r);
      execute format('revoke execute on function public.acq_rep_can_email(uuid,uuid) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.acq_rep_can_email(uuid,uuid) to service_role;
  end if;
end $$;
