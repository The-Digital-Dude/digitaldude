-- Migration: 0035_notifications_followups
-- In-app + email notifications for admins and reps (replies, assignments, health alerts) and the bookkeeping
-- the assignment digest needs. Requires 0022-0034.

create table if not exists public.acq_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_employee_id uuid references public.employees(id) on delete cascade,  -- null = the admin
  kind text not null check (btrim(kind) <> ''),
  title text not null check (btrim(title) <> ''),
  body text not null default '',
  link text,
  dedupe_key text,                       -- same key = same notification (never sent twice)
  email_sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index if not exists acq_notifications_dedupe_uq on public.acq_notifications (dedupe_key) where dedupe_key is not null;
create index if not exists acq_notifications_unread_idx on public.acq_notifications (recipient_employee_id, created_at desc) where read_at is null;
create index if not exists acq_notifications_unsent_idx on public.acq_notifications (created_at) where email_sent_at is null;

-- The assignment digest emails each rep once per batch of newly assigned companies.
alter table public.acq_assignment_log add column if not exists notified_at timestamptz;
-- Do not email reps about assignments that happened before this feature existed.
update public.acq_assignment_log set notified_at = now() where notified_at is null;
create index if not exists acq_assignment_log_unnotified_idx on public.acq_assignment_log (to_employee_id) where notified_at is null;

do $$
declare r text;
begin
  alter table public.acq_notifications enable row level security;
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke all on public.acq_notifications from %I', r);
    end if;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Follow-ups. Selection and creation live in the database so the rules are enforced in one place:
-- only a lead whose first email was delivered, in an ACTIVE campaign with follow-ups on, after N business days
-- (Australia/Sydney calendar), with no real reply, and at most one follow-up per lead.
-- The follow-up text is rendered by the app from the already-approved follow-up template; the send itself still
-- passes acq_reserve_send (pause, suppression, consent, country, closed company, daily cap, no reply).
-- ---------------------------------------------------------------------------
create or replace function public.acq_add_business_days(p_from timestamptz, p_days int)
returns timestamptz language plpgsql stable as $$
declare t timestamptz := p_from; n int := 0;
begin
  while n < p_days loop
    t := t + interval '1 day';
    if extract(isodow from (t at time zone 'Australia/Sydney')) < 6 then n := n + 1; end if;
  end loop;
  return t;
end $$;

create or replace function public.acq_due_followups(p_now timestamptz default now(), p_limit int default 20)
returns table (lead_id uuid, campaign_id uuid, contact_id uuid, initial_subject text) language sql stable as $$
  select l.id, l.campaign_id, l.contact_id, m.subject
    from public.acq_campaign_leads l
    join public.acq_campaigns c on c.id = l.campaign_id
    join public.acq_email_messages m on m.campaign_lead_id = l.id and m.kind = 'initial' and m.direction = 'outbound'
   where l.status = 'sent'
     and c.status = 'active' and c.followup_enabled and btrim(coalesce(c.followup_body_template, '')) <> ''
     and m.status in ('sent', 'delivered')
     and l.last_message_at is not null
     and public.acq_add_business_days(l.last_message_at, c.followup_delay_business_days) <= p_now
     and not exists (select 1 from public.acq_email_messages f where f.campaign_lead_id = l.id and f.kind = 'follow_up' and f.direction = 'outbound')
     and not exists (select 1 from public.acq_replies r where r.contact_id = l.contact_id and r.classification not in ('out_of_office', 'bounce'))
   order by l.last_message_at
   limit p_limit
$$;

create or replace function public.acq_create_followup(p_lead_id uuid, p_subject text, p_body text)
returns boolean language plpgsql as $$
declare l public.acq_campaign_leads;
begin
  select * into l from public.acq_campaign_leads where id = p_lead_id for update;
  if l.id is null or l.status <> 'sent' then return false; end if;
  if btrim(coalesce(p_subject, '')) = '' or btrim(coalesce(p_body, '')) = '' then return false; end if;
  if exists (select 1 from public.acq_email_messages f where f.campaign_lead_id = l.id and f.kind = 'follow_up' and f.direction = 'outbound') then return false; end if;
  insert into public.acq_email_messages (campaign_lead_id, kind, direction, subject, body, status, content_hash)
  values (l.id, 'follow_up', 'outbound', p_subject, p_body, 'approved', public.acq_message_hash(p_subject, p_body));
  update public.acq_campaign_leads set status = 'follow_up_due', next_action_at = now() where id = l.id;
  return true;
end $$;

do $$
declare f text; r text;
begin
  foreach f in array array['acq_add_business_days(timestamptz,int)', 'acq_due_followups(timestamptz,int)', 'acq_create_followup(uuid,text,text)'] loop
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
