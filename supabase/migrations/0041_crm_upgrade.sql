-- Migration: 0041_crm_upgrade
-- Rep CRM upgrade: activity timeline, tasks with reminders, lead status (alongside the stage), deal fields and lost reasons, scoring
-- columns, tags, country, saved views, plus the database functions for reassigning, merging, erasing and anonymising leads.
-- Requires 0013 (rep_leads) and 0022 (acq_suppressions). Idempotent.

do $$
begin
  if to_regclass('public.rep_leads') is null then
    raise exception 'rep_leads is required (migration 0013) before 0041';
  end if;
end $$;

-- ---------------------------------------------------------------------------------------------------------------------
-- Lead columns
-- ---------------------------------------------------------------------------------------------------------------------
alter table public.rep_leads
  add column if not exists status text not null default 'new',
  add column if not exists lost_reason text,
  add column if not exists lost_note text,
  add column if not exists expected_close_date date,
  add column if not exists probability smallint,
  add column if not exists country text,
  add column if not exists tags text[] not null default '{}',
  add column if not exists fit_score smallint,
  add column if not exists engagement_score smallint,
  add column if not exists score_updated_at timestamptz,
  add column if not exists last_activity_at timestamptz,
  add column if not exists anonymized_at timestamptz;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rep_leads_status_check') then
    alter table public.rep_leads add constraint rep_leads_status_check check (status in ('new','attempted','connected','interested','bad_timing','unqualified'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rep_leads_lost_reason_check') then
    alter table public.rep_leads add constraint rep_leads_lost_reason_check check (lost_reason is null or lost_reason in ('no_budget','no_need','chose_competitor','no_response','bad_timing','not_a_fit','other'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rep_leads_probability_check') then
    alter table public.rep_leads add constraint rep_leads_probability_check check (probability is null or probability between 0 and 100);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'rep_leads_country_check') then
    alter table public.rep_leads add constraint rep_leads_country_check check (country is null or country ~ '^[A-Z]{2}$');
  end if;
end $$;

create index if not exists rep_leads_email_lower_idx on public.rep_leads (lower(email));
create index if not exists rep_leads_owner_stage_idx on public.rep_leads (employee_id, stage);
create index if not exists rep_leads_last_activity_idx on public.rep_leads (last_activity_at);

-- A lead cannot be moved to "lost" without a reason (old rows already lost are left alone).
create or replace function public.rep_leads_lost_guard() returns trigger language plpgsql as $$
begin
  if new.stage = 'lost' and (tg_op = 'INSERT' or old.stage is distinct from 'lost') and new.lost_reason is null then
    raise exception 'A lead can only be marked lost with a reason' using errcode = 'check_violation';
  end if;
  return new;
end $$;
drop trigger if exists rep_leads_lost_guard_trg on public.rep_leads;
create trigger rep_leads_lost_guard_trg before insert or update of stage, lost_reason on public.rep_leads for each row execute function public.rep_leads_lost_guard();

-- ---------------------------------------------------------------------------------------------------------------------
-- Timeline
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.rep_lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.rep_leads(id) on delete cascade,
  employee_id uuid,                                                   -- who did it (null = the system)
  type text not null check (type in ('created','email_sent','email_reply','call','meeting','linkedin','whatsapp','note','stage_change','status_change','task_done','booking','reassigned','system')),
  outcome text check (outcome is null or length(outcome) <= 40),
  summary text not null default '' check (length(summary) <= 1000),
  details jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists rep_lead_activities_lead_idx on public.rep_lead_activities (lead_id, occurred_at desc);

create or replace function public.rep_lead_activity_touch() returns trigger language plpgsql as $$
begin
  if new.type <> 'system' then
    update public.rep_leads set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at) where id = new.lead_id;
  end if;
  return new;
end $$;
drop trigger if exists rep_lead_activity_touch_trg on public.rep_lead_activities;
create trigger rep_lead_activity_touch_trg after insert on public.rep_lead_activities for each row execute function public.rep_lead_activity_touch();

-- ---------------------------------------------------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.rep_lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.rep_leads(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  title text not null check (btrim(title) <> '' and length(title) <= 200),
  due_at timestamptz not null,
  status text not null default 'open' check (status in ('open','done','cancelled')),
  kind text not null default 'manual' check (kind in ('manual','follow_up','respond','prepare_call')),
  auto boolean not null default false,
  cancel_reason text,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists rep_lead_tasks_owner_idx on public.rep_lead_tasks (employee_id, status, due_at);
create index if not exists rep_lead_tasks_lead_idx on public.rep_lead_tasks (lead_id, status);
-- Only one open automatic task of each kind per lead, so a busy day never piles up duplicates.
create unique index if not exists rep_lead_tasks_one_open_auto_uq on public.rep_lead_tasks (lead_id, kind) where auto and status = 'open';

-- ---------------------------------------------------------------------------------------------------------------------
-- Saved views
-- ---------------------------------------------------------------------------------------------------------------------
create table if not exists public.rep_saved_views (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  name text not null check (btrim(name) <> '' and length(name) <= 60),
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (employee_id, name)
);

-- ---------------------------------------------------------------------------------------------------------------------
-- Reassign, merge, erase, retention
-- ---------------------------------------------------------------------------------------------------------------------
create or replace function public.rep_reassign_leads(p_lead_ids uuid[], p_to uuid, p_actor text)
returns integer language plpgsql as $$
declare n integer := 0; r record; to_status text;
begin
  select status into to_status from public.employees where id = p_to;
  if to_status is null or to_status = 'offboarded' then raise exception 'new owner not found or offboarded' using errcode = 'check_violation'; end if;
  for r in select id, employee_id, full_name from public.rep_leads where id = any(p_lead_ids) and employee_id <> p_to and anonymized_at is null for update loop
    update public.rep_leads set employee_id = p_to, updated_at = now() where id = r.id;
    update public.rep_lead_tasks set employee_id = p_to where lead_id = r.id and status = 'open';
    insert into public.rep_lead_activities (lead_id, employee_id, type, summary, details)
      values (r.id, null, 'reassigned', 'Reassigned to a new owner', jsonb_build_object('from', r.employee_id, 'to', p_to, 'by', p_actor));
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.rep_merge_leads(p_keep uuid, p_drop uuid, p_actor text)
returns void language plpgsql as $$
declare k public.rep_leads; d public.rep_leads;
begin
  if p_keep = p_drop then raise exception 'cannot merge a lead into itself' using errcode = 'check_violation'; end if;
  select * into k from public.rep_leads where id = p_keep for update;
  select * into d from public.rep_leads where id = p_drop for update;
  if k.id is null or d.id is null then raise exception 'lead not found' using errcode = 'no_data_found'; end if;
  update public.rep_lead_activities set lead_id = p_keep where lead_id = p_drop;
  update public.rep_lead_tasks set lead_id = p_keep, employee_id = k.employee_id where lead_id = p_drop and status = 'open' and not (auto and exists (select 1 from public.rep_lead_tasks t where t.lead_id = p_keep and t.kind = rep_lead_tasks.kind and t.auto and t.status = 'open'));
  update public.rep_leads set
    phone = coalesce(k.phone, d.phone), company_name = coalesce(k.company_name, d.company_name), job_title = coalesce(k.job_title, d.job_title),
    country = coalesce(k.country, d.country),
    tags = (select coalesce(array_agg(distinct t), '{}') from unnest(k.tags || d.tags) t),
    notes = nullif(concat_ws(E'\n\n', k.notes, case when d.notes is not null then '(merged from ' || d.full_name || ') ' || d.notes end), ''),
    estimated_deal_value = greatest(coalesce(k.estimated_deal_value, 0), coalesce(d.estimated_deal_value, 0)),
    updated_at = now()
   where id = p_keep;
  insert into public.rep_lead_activities (lead_id, employee_id, type, summary, details)
    values (p_keep, null, 'system', 'Merged a duplicate lead into this one', jsonb_build_object('dropped_email', d.email, 'by', p_actor));
  delete from public.rep_leads where id = p_drop;
end $$;

-- Erases a person's data from the CRM. The address goes on the do-not-contact list first (that is the one thing we keep, so they are never contacted again).
create or replace function public.rep_erase_lead(p_lead uuid, p_actor text, p_suppress boolean default true)
returns void language plpgsql as $$
declare l public.rep_leads;
begin
  select * into l from public.rep_leads where id = p_lead for update;
  if l.id is null then raise exception 'lead not found' using errcode = 'no_data_found'; end if;
  if p_suppress and l.anonymized_at is null and to_regclass('public.acq_suppressions') is not null then
    insert into public.acq_suppressions (normalized_email, reason, source) values (lower(btrim(l.email)), 'objection', 'crm-erase:' || coalesce(p_actor, 'unknown'))
    on conflict do nothing;
  end if;
  delete from public.rep_lead_activities where lead_id = p_lead;
  delete from public.rep_lead_tasks where lead_id = p_lead;
  if to_regclass('public.rep_outreach_logs') is not null then
    execute 'delete from public.rep_outreach_logs where lower(recipient_email) = $1' using lower(btrim(l.email));
  end if;
  update public.rep_leads set
    full_name = 'Erased lead', email = 'erased-' || id::text || '@erased.invalid', phone = null, company_name = null, job_title = null, notes = null, lost_note = null,
    tags = '{}', fit_score = null, engagement_score = null, anonymized_at = now(), updated_at = now()
   where id = p_lead;
end $$;

-- Anonymises (not won) leads with no activity for N months. Does not add anyone to the suppression list.
create or replace function public.rep_retention_sweep(p_months integer)
returns integer language plpgsql as $$
declare r record; n integer := 0;
begin
  if p_months is null or p_months < 6 then raise exception 'retention period must be at least 6 months' using errcode = 'check_violation'; end if;
  for r in select id from public.rep_leads
            where anonymized_at is null and stage <> 'won' and coalesce(last_activity_at, updated_at, created_at) < now() - make_interval(months => p_months) loop
    perform public.rep_erase_lead(r.id, 'retention-sweep', false);
    n := n + 1;
  end loop;
  return n;
end $$;

-- ---------------------------------------------------------------------------------------------------------------------
-- Access: service role only (like every other rep table)
-- ---------------------------------------------------------------------------------------------------------------------
do $$
declare t text; f text; r text;
begin
  foreach t in array array['rep_lead_activities', 'rep_lead_tasks', 'rep_saved_views'] loop
    execute format('alter table public.%I enable row level security', t);
    foreach r in array array['anon','authenticated'] loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke all on public.%I from %I', t, r);
      end if;
    end loop;
  end loop;
  foreach f in array array['rep_reassign_leads(uuid[],uuid,text)', 'rep_merge_leads(uuid,uuid,text)', 'rep_erase_lead(uuid,text,boolean)', 'rep_retention_sweep(integer)'] loop
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
