-- Migration: 0022_acquisition_system.sql
-- Description: AI Client Acquisition System (Australian property managers pilot).
--
-- Design notes
--  * Every table/function is prefixed `acq_` because `jobs`, `contacts`, etc.
--    already mean other things in this database (recruiting, CRM).
--  * Compliance rules live in the database, not only in the app, so no code
--    path (dashboard, worker, AI, a future script) can skip them:
--      - a contact can only be 'eligible' with a reviewed, evidenced consent basis
--      - a lead can only join a campaign if its contact is eligible
--      - campaign content is frozen once approved (hash-verified)
--      - suppressions are append-only and immediately stop all pending outreach
--      - acq_reserve_send() is the single transactional gate every send must pass
--  * All access is server-side with the service-role key. RLS is enabled with
--    NO policies, so anon/authenticated clients can read and write nothing.
--  * No extensions required (uses built-in gen_random_uuid() and sha256()).

-- ---------------------------------------------------------------------------
-- 0. Helpers
-- ---------------------------------------------------------------------------

create or replace function public.acq_normalize_email(p_email text)
returns text language sql immutable as $$
  select lower(btrim(p_email))
$$;

create or replace function public.acq_email_domain(p_email text)
returns text language sql immutable as $$
  select nullif(split_part(public.acq_normalize_email(p_email), '@', 2), '')
$$;

create or replace function public.acq_message_hash(p_subject text, p_body text)
returns text language sql immutable as $$
  select encode(sha256(convert_to(coalesce(p_subject, '') || E'\n' || coalesce(p_body, ''), 'UTF8')), 'hex')
$$;

create or replace function public.acq_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

create or replace function public.acq_block_mutation()
returns trigger language plpgsql as $$
begin
  raise exception '% rows are append-only (% blocked)', tg_table_name, tg_op
    using errcode = 'restrict_violation';
end $$;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

create table if not exists public.acq_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
-- Fail closed: nothing sends until the owner explicitly un-pauses.
insert into public.acq_settings (key, value) values ('sending_paused', 'true'::jsonb)
on conflict (key) do nothing;

create table if not exists public.acq_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  website text,
  domain text unique,                       -- normalised: lower-case, no scheme/www
  state text check (state is null or state in ('NSW','VIC','QLD','WA','SA','TAS','ACT','NT')),
  suburb text,
  property_portfolio_evidence text,
  summary text,
  potential_opportunity text,
  decision_maker_role text,
  research_confidence numeric(3,2) check (research_confidence is null or research_confidence between 0 and 1),
  missing_evidence jsonb not null default '[]'::jsonb,
  last_researched_at timestamptz,
  fit_score integer check (fit_score is null or fit_score between 0 and 100),
  fit_band text check (fit_band is null or fit_band in ('prioritize_review','gather_evidence','deprioritize')),
  status text not null default 'new'
    check (status in ('new','researching','researched','qualified','deprioritized','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acq_contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.acq_companies(id) on delete set null,
  name text,
  role text,
  email text not null,
  email_normalized text generated always as (lower(btrim(email))) stored,
  source_url text,
  source_type text not null default 'manual_import'
    check (source_type in ('company_website','public_directory','referral','inbound_enquiry','existing_client','manual_import','other')),
  last_verified_at timestamptz,
  status text not null default 'new'
    check (status in ('new','needs_review','eligible','blocked','suppressed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint acq_contacts_email_format check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  constraint acq_contacts_email_unique unique (email_normalized)
);

-- Append-only history: a new review is a new row; the latest row wins.
create table if not exists public.acq_consent_records (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  consent_type text not null
    check (consent_type in ('express','inferred_publication','existing_relationship','unverified','withdrawn')),
  legal_basis text,
  evidence_url text,
  evidence_notes text,
  reviewed_by text,
  reviewed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default clock_timestamp(),
  -- Consent can only be asserted by a person, never by the model or the system.
  constraint acq_consent_human_reviewer check (reviewed_by is null or lower(btrim(reviewed_by)) not in ('ai','model','llm','system','worker'))
);

create table if not exists public.acq_research_records (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.acq_companies(id) on delete cascade,
  category text check (category is null or category in
    ('identity','portfolio','opportunity','technology','decision_maker','source')),
  strength numeric(3,2) check (strength is null or strength between 0 and 1),
  source_url text not null,
  observed_fact text not null,
  evidence_excerpt text not null,
  research_date timestamptz not null default now(),
  model_version text
);

create table if not exists public.acq_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null check (btrim(name) <> ''),
  market text not null default 'AU property management',
  status text not null default 'draft'
    check (status in ('draft','pending_approval','approved','active','paused','completed','rejected')),
  approved_by text,
  approved_at timestamptz,
  approved_content_hash text,
  rejection_reason text,
  daily_limit integer not null default 5 check (daily_limit between 1 and 50),
  -- Sender identity (Spam Act: accurate identification of the sender)
  sender_name text not null default '',
  sender_business text not null default '',
  sender_postal_address text not null default '',
  sender_email text not null default '',
  -- Content (frozen on approval)
  subject_template text not null default '',
  body_template text not null default '',
  followup_enabled boolean not null default true,
  followup_delay_business_days integer not null default 7 check (followup_delay_business_days between 1 and 30),
  followup_body_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint acq_campaign_human_approver check (approved_by is null or lower(btrim(approved_by)) not in ('ai','model','llm','system','worker'))
);

create table if not exists public.acq_campaign_leads (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.acq_campaigns(id) on delete cascade,
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  status text not null default 'draft'
    check (status in ('draft','approved','sent','follow_up_due','replied','opted_out','bounced','stopped','completed')),
  sequence_step integer not null default 0,
  next_action_at timestamptz,
  last_message_at timestamptz,
  stop_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (campaign_id, contact_id)
);

create table if not exists public.acq_email_messages (
  id uuid primary key default gen_random_uuid(),
  campaign_lead_id uuid not null references public.acq_campaign_leads(id) on delete cascade,
  kind text not null default 'initial' check (kind in ('initial','follow_up')),
  provider_message_id text,
  direction text not null default 'outbound' check (direction in ('outbound','inbound')),
  subject text not null default '',
  body text not null default '',
  content_hash text,
  status text not null default 'draft'
    check (status in ('draft','approved','sending','sent','delivered','bounced','failed','cancelled','received')),
  reserved_at timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
-- At most one outbound message per kind per lead.
create unique index if not exists acq_email_messages_one_per_kind
  on public.acq_email_messages (campaign_lead_id, kind) where direction = 'outbound';

create table if not exists public.acq_replies (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  email_message_id uuid references public.acq_email_messages(id) on delete set null,
  provider_event_id text,
  body text,
  classification text not null default 'uncertain'
    check (classification in ('interested','not_interested','opt_out','out_of_office','bounce','uncertain')),
  confidence numeric(3,2) check (confidence is null or confidence between 0 and 1),
  classified_by text not null default 'rules' check (classified_by in ('rules','ai','human')),
  human_review_status text not null default 'pending'
    check (human_review_status in ('pending','not_required','reviewed')),
  received_at timestamptz not null default now()
);

-- Append-only. No FK to contacts: erasing a lead must not erase the opt-out.
create table if not exists public.acq_suppressions (
  id uuid primary key default gen_random_uuid(),
  normalized_email text,
  company_domain text,
  reason text not null
    check (reason in ('unsubscribe','reply_opt_out','objection','hard_bounce','spam_complaint','manual')),
  source text,
  created_at timestamptz not null default now(),
  constraint acq_suppression_target check (normalized_email is not null or company_domain is not null),
  constraint acq_suppression_email_norm check (normalized_email is null or normalized_email = lower(btrim(normalized_email))),
  constraint acq_suppression_domain_norm check (company_domain is null or company_domain = lower(btrim(company_domain)))
);
create unique index if not exists acq_suppressions_email_uq on public.acq_suppressions (normalized_email) where normalized_email is not null;
create unique index if not exists acq_suppressions_domain_uq on public.acq_suppressions (company_domain) where company_domain is not null;

create table if not exists public.acq_jobs (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending','running','succeeded','failed','cancelled')),
  run_at timestamptz not null default now(),
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  idempotency_key text not null unique,
  campaign_lead_id uuid references public.acq_campaign_leads(id) on delete cascade,
  locked_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acq_meetings (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.acq_contacts(id) on delete cascade,
  booking_url text,
  scheduled_at timestamptz,
  status text not null default 'link_sent'
    check (status in ('link_sent','scheduled','attended','no_show','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.acq_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);

create table if not exists public.acq_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id text not null default 'system',
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------
create index if not exists acq_companies_status_idx on public.acq_companies (status, fit_score desc);
create index if not exists acq_contacts_company_idx on public.acq_contacts (company_id);
create index if not exists acq_contacts_status_idx on public.acq_contacts (status);
create index if not exists acq_consent_contact_idx on public.acq_consent_records (contact_id, created_at desc);
create index if not exists acq_research_company_idx on public.acq_research_records (company_id);
create index if not exists acq_campaign_leads_status_idx on public.acq_campaign_leads (status, next_action_at);
create index if not exists acq_campaign_leads_contact_idx on public.acq_campaign_leads (contact_id);
create index if not exists acq_messages_status_idx on public.acq_email_messages (status, reserved_at);
create index if not exists acq_replies_contact_idx on public.acq_replies (contact_id, received_at desc);
create unique index if not exists acq_replies_event_uq on public.acq_replies (provider_event_id) where provider_event_id is not null;
create index if not exists acq_replies_review_idx on public.acq_replies (human_review_status);
create index if not exists acq_jobs_status_run_at_idx on public.acq_jobs (status, run_at);
create index if not exists acq_audit_entity_idx on public.acq_audit_logs (entity_type, entity_id, created_at desc);

-- updated_at triggers
do $$
declare t text;
begin
  foreach t in array array['acq_settings','acq_companies','acq_contacts','acq_campaigns','acq_campaign_leads','acq_jobs','acq_meetings']
  loop
    execute format('drop trigger if exists %I on public.%I', t || '_touch', t);
    execute format('create trigger %I before update on public.%I for each row execute function public.acq_touch_updated_at()', t || '_touch', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Suppression + consent primitives
-- ---------------------------------------------------------------------------

create or replace function public.acq_is_suppressed(p_email text)
returns boolean language sql stable as $$
  select exists (
    select 1 from public.acq_suppressions s
    where s.normalized_email = public.acq_normalize_email(p_email)
       or s.company_domain  = public.acq_email_domain(p_email)
  )
$$;

-- True only if the contact's LATEST consent record is a reviewed, evidenced,
-- unexpired basis for outreach. 'unverified' / 'withdrawn' / no record => false.
create or replace function public.acq_contact_consent_ok(p_contact_id uuid)
returns boolean language sql stable as $$
  select coalesce((
    select
      r.consent_type in ('express','inferred_publication','existing_relationship')
      and r.reviewed_by is not null and r.reviewed_at is not null
      and (r.expires_at is null or r.expires_at > now())
      and coalesce(btrim(r.legal_basis), '') <> ''
      and (coalesce(btrim(r.evidence_url), '') <> '' or coalesce(btrim(r.evidence_notes), '') <> '')
      -- Inferred consent must point at the page where the address was published.
      and (r.consent_type <> 'inferred_publication' or coalesce(btrim(r.evidence_url), '') <> '')
    from public.acq_consent_records r
    where r.contact_id = p_contact_id
    order by r.created_at desc, r.id desc
    limit 1
  ), false)
$$;

-- A contact can only be marked eligible when consent + suppression checks pass.
create or replace function public.acq_contacts_guard()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' and public.acq_is_suppressed(new.email) then
    new.status := 'suppressed';
  end if;
  if new.status = 'eligible' then
    if public.acq_is_suppressed(new.email) then
      raise exception 'contact % is suppressed and cannot be eligible', new.email using errcode = 'check_violation';
    end if;
    -- On INSERT no consent record can exist yet (FK), so 'eligible' is never valid.
    if tg_op = 'INSERT' or not public.acq_contact_consent_ok(new.id) then
      raise exception 'contact % has no reviewed consent basis; cannot be eligible', new.email using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists acq_contacts_guard_trg on public.acq_contacts;
create trigger acq_contacts_guard_trg before insert or update of status, email on public.acq_contacts
  for each row execute function public.acq_contacts_guard();

-- Append-only histories
drop trigger if exists acq_consent_no_update on public.acq_consent_records;
create trigger acq_consent_no_update before update on public.acq_consent_records
  for each row execute function public.acq_block_mutation();
drop trigger if exists acq_suppress_no_mutation on public.acq_suppressions;
create trigger acq_suppress_no_mutation before update or delete on public.acq_suppressions
  for each row execute function public.acq_block_mutation();
drop trigger if exists acq_audit_no_mutation on public.acq_audit_logs;
create trigger acq_audit_no_mutation before update or delete on public.acq_audit_logs
  for each row execute function public.acq_block_mutation();

create or replace function public.acq_audit_event(p_action text, p_type text, p_id uuid, p_meta jsonb)
returns void language sql as $$
  insert into public.acq_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (coalesce(nullif(current_setting('acq.actor', true), ''), 'system'), p_action, p_type, p_id, coalesce(p_meta, '{}'::jsonb))
$$;

-- Adding a suppression immediately stops everything pending for that address/domain.
create or replace function public.acq_suppression_apply()
returns trigger language plpgsql as $$
declare affected uuid[];
begin
  select coalesce(array_agg(id), '{}') into affected from public.acq_contacts c
   where (new.normalized_email is not null and c.email_normalized = new.normalized_email)
      or (new.company_domain  is not null and public.acq_email_domain(c.email) = new.company_domain);

  update public.acq_contacts set status = 'suppressed' where id = any(affected) and status <> 'suppressed';

  update public.acq_campaign_leads
     set status = 'opted_out', stop_reason = 'suppressed: ' || new.reason, next_action_at = null
   where contact_id = any(affected) and status in ('draft','approved','sent','follow_up_due');

  update public.acq_email_messages m set status = 'cancelled'
    from public.acq_campaign_leads l
   where m.campaign_lead_id = l.id and l.contact_id = any(affected)
     and m.direction = 'outbound' and m.status in ('draft','approved');

  update public.acq_jobs set status = 'cancelled', last_error = 'recipient suppressed'
   where status in ('pending','running')
     and campaign_lead_id in (select id from public.acq_campaign_leads where contact_id = any(affected));

  perform public.acq_audit_event('suppression.added', 'suppression', new.id,
    jsonb_build_object('reason', new.reason, 'source', new.source, 'has_email', new.normalized_email is not null, 'domain', new.company_domain));
  return new;
end $$;
drop trigger if exists acq_suppression_apply_trg on public.acq_suppressions;
create trigger acq_suppression_apply_trg after insert on public.acq_suppressions
  for each row execute function public.acq_suppression_apply();

create or replace function public.acq_consent_audit()
returns trigger language plpgsql as $$
begin
  perform public.acq_audit_event('consent.recorded', 'contact', new.contact_id,
    jsonb_build_object('consent_record_id', new.id, 'consent_type', new.consent_type, 'reviewed_by', new.reviewed_by));
  return new;
end $$;
drop trigger if exists acq_consent_audit_trg on public.acq_consent_records;
create trigger acq_consent_audit_trg after insert on public.acq_consent_records
  for each row execute function public.acq_consent_audit();

-- ---------------------------------------------------------------------------
-- 4. Campaign content hash, freeze and state machine
-- ---------------------------------------------------------------------------

-- Hash over every approved input: sender identity, templates, limits and each
-- initial draft. Follow-up rows are excluded (rendered later from the template).
create or replace function public.acq_campaign_content_hash(p_campaign_id uuid)
returns text language sql stable as $$
  select encode(sha256(convert_to(
    concat_ws(chr(31),
      c.market, c.daily_limit::text,
      c.sender_name, c.sender_business, c.sender_postal_address, c.sender_email,
      c.subject_template, c.body_template,
      c.followup_enabled::text, c.followup_delay_business_days::text, coalesce(c.followup_body_template, ''),
      coalesce((
        select string_agg(m.campaign_lead_id::text || ':' || public.acq_message_hash(m.subject, m.body), ',' order by m.campaign_lead_id)
          from public.acq_email_messages m
          join public.acq_campaign_leads l on l.id = m.campaign_lead_id
         where l.campaign_id = c.id and m.direction = 'outbound' and m.kind = 'initial'
      ), '')
    ), 'UTF8')), 'hex')
  from public.acq_campaigns c where c.id = p_campaign_id
$$;

create or replace function public.acq_campaigns_guard()
returns trigger language plpgsql as $$
declare ok boolean;
begin
  if tg_op = 'INSERT' then
    new.status := 'draft';
    new.approved_by := null; new.approved_at := null; new.approved_content_hash := null;
    return new;
  end if;

  -- Content is frozen once the campaign leaves draft/rejected.
  if old.status not in ('draft','rejected') and (
       new.market is distinct from old.market or new.daily_limit is distinct from old.daily_limit
    or new.sender_name is distinct from old.sender_name or new.sender_business is distinct from old.sender_business
    or new.sender_postal_address is distinct from old.sender_postal_address or new.sender_email is distinct from old.sender_email
    or new.subject_template is distinct from old.subject_template or new.body_template is distinct from old.body_template
    or new.followup_enabled is distinct from old.followup_enabled
    or new.followup_delay_business_days is distinct from old.followup_delay_business_days
    or new.followup_body_template is distinct from old.followup_body_template) then
    raise exception 'campaign % content is frozen while status is %; revoke approval to edit', old.id, old.status
      using errcode = 'restrict_violation';
  end if;

  if new.status is distinct from old.status then
    ok := (old.status, new.status) in (
      ('draft','pending_approval'), ('pending_approval','approved'), ('pending_approval','rejected'),
      ('pending_approval','draft'), ('rejected','draft'),
      ('approved','active'), ('approved','draft'), ('approved','completed'),
      ('active','paused'), ('active','completed'), ('paused','active'), ('paused','completed'));
    if not ok then
      raise exception 'illegal campaign transition % -> %', old.status, new.status using errcode = 'check_violation';
    end if;

    if new.status = 'approved' then
      if new.approved_by is null or new.approved_at is null or new.approved_content_hash is null then
        raise exception 'approval requires approved_by, approved_at and approved_content_hash' using errcode = 'check_violation';
      end if;
      if new.approved_content_hash <> public.acq_campaign_content_hash(new.id) then
        raise exception 'approved_content_hash does not match campaign content' using errcode = 'check_violation';
      end if;
    elsif new.status = 'active' then
      if old.approved_content_hash is null or old.approved_content_hash <> public.acq_campaign_content_hash(new.id) then
        raise exception 'campaign content changed since approval; cannot activate' using errcode = 'check_violation';
      end if;
    elsif new.status in ('draft','pending_approval','rejected') then
      new.approved_by := null; new.approved_at := null; new.approved_content_hash := null;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists acq_campaigns_guard_trg on public.acq_campaigns;
create trigger acq_campaigns_guard_trg before insert or update on public.acq_campaigns
  for each row execute function public.acq_campaigns_guard();

create or replace function public.acq_campaigns_audit()
returns trigger language plpgsql as $$
begin
  perform public.acq_audit_event('campaign.' || new.status, 'campaign', new.id,
    jsonb_build_object('from', old.status, 'to', new.status, 'content_hash', new.approved_content_hash,
                       'daily_limit', new.daily_limit, 'rejection_reason', new.rejection_reason));
  return new;
end $$;
drop trigger if exists acq_campaigns_audit_trg on public.acq_campaigns;
create trigger acq_campaigns_audit_trg after update of status on public.acq_campaigns
  for each row when (old.status is distinct from new.status)
  execute function public.acq_campaigns_audit();

-- Only eligible contacts may join, and only while the campaign is a draft.
create or replace function public.acq_campaign_leads_guard()
returns trigger language plpgsql as $$
declare c_status text; ct record;
begin
  select status into c_status from public.acq_campaigns where id = new.campaign_id;
  if c_status is distinct from 'draft' then
    raise exception 'leads can only be added to a draft campaign (status: %)', c_status using errcode = 'restrict_violation';
  end if;
  select email, status, id into ct from public.acq_contacts where id = new.contact_id;
  if ct.id is null or ct.status <> 'eligible'
     or not public.acq_contact_consent_ok(ct.id) or public.acq_is_suppressed(ct.email) then
    raise exception 'contact is not eligible for outreach (unverified, unreviewed or suppressed)' using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists acq_campaign_leads_guard_trg on public.acq_campaign_leads;
create trigger acq_campaign_leads_guard_trg before insert on public.acq_campaign_leads
  for each row execute function public.acq_campaign_leads_guard();

-- Message rows: initial drafts only on draft campaigns; text frozen after draft.
create or replace function public.acq_messages_guard()
returns trigger language plpgsql as $$
declare c_status text;
begin
  if tg_op = 'INSERT' then
    if new.direction = 'outbound' and new.kind = 'initial' then
      select c.status into c_status from public.acq_campaign_leads l
        join public.acq_campaigns c on c.id = l.campaign_id where l.id = new.campaign_lead_id;
      if c_status is distinct from 'draft' then
        raise exception 'initial drafts can only be created on a draft campaign (status: %)', c_status using errcode = 'restrict_violation';
      end if;
      new.status := 'draft'; new.content_hash := null;
    end if;
    return new;
  end if;
  if old.status <> 'draft' and (new.subject is distinct from old.subject or new.body is distinct from old.body
       or new.kind is distinct from old.kind or new.campaign_lead_id is distinct from old.campaign_lead_id) then
    raise exception 'message % content is frozen after approval', old.id using errcode = 'restrict_violation';
  end if;
  return new;
end $$;
drop trigger if exists acq_messages_guard_trg on public.acq_email_messages;
create trigger acq_messages_guard_trg before insert or update on public.acq_email_messages
  for each row execute function public.acq_messages_guard();

-- ---------------------------------------------------------------------------
-- 5. Campaign workflow RPCs (single transaction, actor recorded in audit log)
-- ---------------------------------------------------------------------------

create or replace function public.acq_set_campaign_status(p_campaign_id uuid, p_status text, p_actor text, p_reason text default null)
returns void language plpgsql as $$
declare c public.acq_campaigns; n int;
begin
  perform set_config('acq.actor', coalesce(p_actor, 'system'), true);
  select * into c from public.acq_campaigns where id = p_campaign_id for update;
  if c.id is null then raise exception 'campaign not found' using errcode = 'no_data_found'; end if;

  if p_status = 'pending_approval' then
    select count(*) into n from public.acq_email_messages m join public.acq_campaign_leads l on l.id = m.campaign_lead_id
      where l.campaign_id = c.id and m.direction = 'outbound' and m.kind = 'initial' and m.status = 'draft';
    if n = 0 then raise exception 'campaign has no drafts to approve' using errcode = 'check_violation'; end if;
  elsif p_status = 'draft' and c.status = 'approved' then
    -- Revoke approval: drafts become editable again (nothing has been sent yet).
    update public.acq_email_messages m set status = 'draft', content_hash = null
      from public.acq_campaign_leads l
     where m.campaign_lead_id = l.id and l.campaign_id = c.id and m.status = 'approved';
    update public.acq_campaign_leads set status = 'draft' where campaign_id = c.id and status = 'approved';
  elsif p_status = 'draft' and c.status = 'pending_approval' then
    null;
  end if;

  update public.acq_campaigns
     set status = p_status,
         rejection_reason = case when p_status = 'rejected' then p_reason else rejection_reason end
   where id = c.id;
end $$;

-- Approve exactly what the reviewer saw: p_seen_hash is the hash shown in the
-- preview. If anything changed since, approval is refused.
create or replace function public.acq_approve_campaign(p_campaign_id uuid, p_seen_hash text, p_actor text)
returns text language plpgsql as $$
declare c public.acq_campaigns; h text; bad record; n int;
begin
  if p_actor is null or btrim(p_actor) = '' then raise exception 'approver required' using errcode = 'check_violation'; end if;
  perform set_config('acq.actor', p_actor, true);
  select * into c from public.acq_campaigns where id = p_campaign_id for update;
  if c.id is null then raise exception 'campaign not found' using errcode = 'no_data_found'; end if;
  if c.status <> 'pending_approval' then
    raise exception 'campaign is % (must be pending_approval)', c.status using errcode = 'check_violation';
  end if;

  h := public.acq_campaign_content_hash(c.id);
  if h is distinct from p_seen_hash then
    raise exception 'content_changed_since_preview' using errcode = 'check_violation';
  end if;

  -- Every recipient must still be eligible at the moment of approval.
  for bad in
    select ct.email from public.acq_campaign_leads l
      join public.acq_contacts ct on ct.id = l.contact_id
     where l.campaign_id = c.id
       and (ct.status <> 'eligible' or not public.acq_contact_consent_ok(ct.id) or public.acq_is_suppressed(ct.email))
  loop
    raise exception 'ineligible_recipient: %', bad.email using errcode = 'check_violation';
  end loop;

  select count(*) into n from public.acq_email_messages m join public.acq_campaign_leads l on l.id = m.campaign_lead_id
   where l.campaign_id = c.id and m.direction = 'outbound' and m.kind = 'initial' and m.status = 'draft';
  if n = 0 then raise exception 'campaign has no drafts to approve' using errcode = 'check_violation'; end if;

  update public.acq_email_messages m
     set status = 'approved', content_hash = public.acq_message_hash(m.subject, m.body)
    from public.acq_campaign_leads l
   where m.campaign_lead_id = l.id and l.campaign_id = c.id
     and m.direction = 'outbound' and m.kind = 'initial' and m.status = 'draft';
  update public.acq_campaign_leads set status = 'approved' where campaign_id = c.id and status = 'draft';

  update public.acq_campaigns
     set status = 'approved', approved_by = p_actor, approved_at = now(), approved_content_hash = h
   where id = c.id;
  return h;
end $$;

-- ---------------------------------------------------------------------------
-- 6. The send gate. EVERY outbound email must pass this immediately before it
--    is handed to the email provider, including follow-ups.
-- ---------------------------------------------------------------------------

create or replace function public.acq_reserve_send(p_message_id uuid)
returns table (ok boolean, reason text) language plpgsql as $$
declare
  m public.acq_email_messages; l public.acq_campaign_leads; c public.acq_campaigns; ct public.acq_contacts;
  paused boolean; day_start timestamptz; used int;
begin
  select * into m from public.acq_email_messages where id = p_message_id;
  if m.id is null or m.direction <> 'outbound' then return query select false, 'message_not_found'; return; end if;
  select * into l from public.acq_campaign_leads where id = m.campaign_lead_id;
  -- Lock the campaign first so the daily-limit count is race-free.
  select * into c from public.acq_campaigns where id = l.campaign_id for update;
  select * into m from public.acq_email_messages where id = p_message_id for update;
  select * into l from public.acq_campaign_leads where id = m.campaign_lead_id for update;
  select * into ct from public.acq_contacts where id = l.contact_id;

  select coalesce((select (value)::text = 'true' from public.acq_settings where key = 'sending_paused'), true) into paused;
  if paused then return query select false, 'sending_paused'; return; end if;

  if c.status <> 'active' then return query select false, 'campaign_not_active'; return; end if;
  if c.approved_content_hash is null or c.approved_content_hash <> public.acq_campaign_content_hash(c.id) then
    return query select false, 'campaign_content_changed'; return;
  end if;
  if m.status <> 'approved' then return query select false, 'message_not_approved'; return; end if;
  if m.content_hash is null or m.content_hash <> public.acq_message_hash(m.subject, m.body) then
    return query select false, 'message_content_changed'; return;
  end if;

  if ct.id is null or ct.status <> 'eligible' then return query select false, 'contact_not_eligible'; return; end if;
  -- Suppression is checked here, in the same transaction as the reservation.
  if public.acq_is_suppressed(ct.email) then return query select false, 'suppressed'; return; end if;
  if not public.acq_contact_consent_ok(ct.id) then return query select false, 'consent_invalid'; return; end if;

  if m.kind = 'initial' then
    if l.status <> 'approved' then return query select false, 'lead_not_sendable'; return; end if;
  else
    if not c.followup_enabled then return query select false, 'followup_disabled'; return; end if;
    if l.status <> 'follow_up_due' then return query select false, 'lead_not_sendable'; return; end if;
    if l.next_action_at is null or l.next_action_at > now() then return query select false, 'follow_up_not_due'; return; end if;
    -- Out-of-office and bounce notices are not conversations; anything else is.
    if exists (select 1 from public.acq_replies r where r.contact_id = ct.id
                and r.classification not in ('out_of_office','bounce')) then
      return query select false, 'has_reply'; return;
    end if;
    if not exists (select 1 from public.acq_email_messages i
                    where i.campaign_lead_id = l.id and i.kind = 'initial' and i.status in ('sent','delivered')) then
      return query select false, 'initial_not_delivered'; return;
    end if;
  end if;

  -- Daily cap across the whole campaign (Australia/Sydney calendar day).
  day_start := date_trunc('day', now() at time zone 'Australia/Sydney') at time zone 'Australia/Sydney';
  select count(*) into used from public.acq_email_messages x
    join public.acq_campaign_leads xl on xl.id = x.campaign_lead_id
   where xl.campaign_id = c.id and x.direction = 'outbound'
     and x.reserved_at >= day_start and x.status in ('sending','sent','delivered','bounced');
  if used >= c.daily_limit then return query select false, 'daily_limit_reached'; return; end if;

  update public.acq_email_messages set status = 'sending', reserved_at = now() where id = m.id;
  return query select true, null::text;
end $$;

-- ---------------------------------------------------------------------------
-- 7. Durable job queue
-- ---------------------------------------------------------------------------

create or replace function public.acq_claim_jobs(p_limit integer default 5, p_stale_after interval default interval '10 minutes')
returns setof public.acq_jobs language plpgsql as $$
begin
  -- A worker that died mid-job and exhausted its attempts is failed, not retried forever.
  update public.acq_jobs set status = 'failed', last_error = coalesce(last_error, 'worker lost; attempts exhausted')
   where status = 'running' and locked_at < now() - p_stale_after and attempts >= max_attempts;

  return query
  update public.acq_jobs j
     set status = 'running', attempts = j.attempts + 1, locked_at = now()
   where j.id in (
     select id from public.acq_jobs
      where ((status = 'pending' and run_at <= now())
          or (status = 'running' and locked_at < now() - p_stale_after))
        and attempts < max_attempts
      order by run_at
      for update skip locked
      limit p_limit)
  returning j.*;
end $$;

-- ---------------------------------------------------------------------------
-- 8. Row Level Security: enabled, deliberately NO policies. Only the
--    server-side service role (which bypasses RLS) can touch these tables.
-- ---------------------------------------------------------------------------
do $$
declare t text; r text; f text;
begin
  foreach t in array array['acq_settings','acq_companies','acq_contacts','acq_consent_records','acq_research_records',
    'acq_campaigns','acq_campaign_leads','acq_email_messages','acq_replies','acq_suppressions','acq_jobs',
    'acq_meetings','acq_webhook_events','acq_audit_logs']
  loop
    execute format('alter table public.%I enable row level security', t);
    foreach r in array array['anon','authenticated'] loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke all on public.%I from %I', t, r);
      end if;
    end loop;
  end loop;

  -- Functions are executable by PUBLIC by default, which PostgREST would expose
  -- to the anon key. Lock them to the service role.
  foreach f in array array[
    'acq_set_campaign_status(uuid,text,text,text)', 'acq_approve_campaign(uuid,text,text)',
    'acq_reserve_send(uuid)', 'acq_claim_jobs(integer,interval)', 'acq_campaign_content_hash(uuid)',
    'acq_is_suppressed(text)', 'acq_contact_consent_ok(uuid)']
  loop
    execute format('revoke execute on function public.%s from public', f);
    foreach r in array array['anon','authenticated'] loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke execute on function public.%s from %I', f, r);
      end if;
    end loop;
    if exists (select 1 from pg_roles where rolname = 'service_role') then
      execute format('grant execute on function public.%s to service_role', f);
    end if;
  end loop;
end $$;
