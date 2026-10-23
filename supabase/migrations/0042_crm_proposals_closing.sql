-- Migration: 0042_crm_proposals_closing
-- Description: Connect proposals to rep_leads, add digital signature metadata, live engagement tracking, and project linkage.

do $$
begin
  if to_regclass('public.proposals') is null then
    raise exception 'proposals table (migration 0005) is required before 0042';
  end if;
  if to_regclass('public.rep_leads') is null then
    raise exception 'rep_leads table (migration 0013) is required before 0042';
  end if;
  if to_regclass('public.employees') is null then
    raise exception 'employees table (migration 0010) is required before 0042';
  end if;
  if to_regclass('public.client_projects') is null then
    raise exception 'client_projects table (migration 0014) is required before 0042';
  end if;
end $$;

alter table public.proposals
  add column if not exists lead_id uuid references public.rep_leads(id) on delete set null,
  add column if not exists created_by_rep_id uuid references public.employees(id) on delete set null,
  add column if not exists is_active boolean not null default true,
  add column if not exists version integer not null default 1,
  -- Live View Tracking
  add column if not exists view_count integer not null default 0,
  add column if not exists last_viewed_at timestamptz,
  -- Digital Signature & Execution
  add column if not exists signed_at timestamptz,
  add column if not exists signed_by_name text,
  add column if not exists signed_by_title text,
  add column if not exists signed_signature_data text,
  add column if not exists signed_ip text,
  add column if not exists signed_user_agent text,
  add column if not exists legal_agreement_hash text,
  -- Post-Sale Client Project Link
  add column if not exists project_id uuid references public.client_projects(id) on delete set null;

create index if not exists idx_proposals_lead_id on public.proposals(lead_id);
create index if not exists idx_proposals_rep_id on public.proposals(created_by_rep_id);
create index if not exists idx_proposals_signed_at on public.proposals(signed_at);
