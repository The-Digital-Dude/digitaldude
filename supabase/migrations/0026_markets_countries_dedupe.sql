-- Migration: 0026_markets_countries_dedupe
-- P1 of the global lead pool: configurable Markets (industry x country), per-country email rules,
-- companies generalised beyond Australia/property management, and near-duplicate detection + merge.
-- Requires 0022 and 0023.

-- ---------------------------------------------------------------------------
-- Markets and country rules
-- ---------------------------------------------------------------------------
create table if not exists public.acq_markets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (btrim(name) <> ''),
  industry text not null check (btrim(industry) <> ''),
  country text not null check (country ~ '^[A-Z]{2}$'),
  search_phrases text[] not null default '{}',
  places text[] not null default '{}',
  qualification_text text not null default '',
  domain_suffixes text[] not null default '{}',   -- e.g. {'.au'}; empty = any public business domain
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A country with no row (or email_allowed = false) is BLOCKED for outreach until the owner enables it.
create table if not exists public.acq_country_rules (
  country text primary key check (country ~ '^[A-Z]{2}$'),
  name text not null,
  email_allowed boolean not null default false,
  requires_postal_address boolean not null default false,
  notes text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.acq_country_rules (country, name, email_allowed, requires_postal_address, notes) values
  ('AU', 'Australia', true, false, 'Spam Act 2003: consent (inferred from a conspicuously published, relevant business address is possible), accurate sender identification, working unsubscribe.'),
  ('GB', 'United Kingdom', true, true, 'PECR: corporate subscribers may be emailed with identification and an opt-out; sole traders and some partnerships count as individuals.'),
  ('US', 'United States', true, true, 'CAN-SPAM: no deceptive headers, physical postal address, opt-out honoured within 10 business days.')
on conflict (country) do nothing;

create or replace function public.acq_country_allowed(p_country text)
returns boolean language sql stable as $$
  select coalesce((select email_allowed from public.acq_country_rules where country = upper(btrim(p_country))), false)
$$;

insert into public.acq_markets (name, industry, country, search_phrases, places, qualification_text, domain_suffixes)
values (
  'Property management - Australia', 'Property management', 'AU',
  array['property management company','rental property managers','real estate property management agency','strata and property management'],
  array['Sydney','Melbourne','Brisbane','Perth','Adelaide','Canberra','Hobart','Darwin','Gold Coast','Newcastle','Sunshine Coast','Geelong','Wollongong','Townsville','Cairns'],
  'Property management businesses that could benefit from custom software, workflow automation and owner/tenant reporting.',
  array['.au']
) on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Companies: generalise
-- ---------------------------------------------------------------------------
alter table public.acq_companies
  add column if not exists market_id uuid references public.acq_markets(id) on delete set null,
  add column if not exists country text,
  add column if not exists region text,
  add column if not exists industry text,
  add column if not exists linkedin_url text,
  add column if not exists name_key text,
  add column if not exists possible_duplicate_of uuid references public.acq_companies(id) on delete set null,
  add column if not exists duplicate_dismissed boolean not null default false;

alter table public.acq_companies drop constraint if exists acq_companies_state_check;   -- was Australia-only
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'acq_companies_country_check') then
    alter table public.acq_companies add constraint acq_companies_country_check check (country is null or country ~ '^[A-Z]{2}$');
  end if;
end $$;

-- Normalised name used for near-duplicate matching: lower-case, no punctuation, no legal suffixes.
create or replace function public.acq_name_key(p_name text)
returns text language sql immutable as $$
  select btrim(regexp_replace(
           regexp_replace(
             regexp_replace(lower(coalesce(p_name, '')), '[^a-z0-9 ]+', ' ', 'g'),
             '\m(pty|ltd|limited|llc|inc|incorporated|co|company|corp|corporation|plc|the|and)\M', ' ', 'g'),
           '\s+', ' ', 'g'))
$$;

create or replace function public.acq_companies_keys()
returns trigger language plpgsql as $$
begin
  new.name_key := public.acq_name_key(new.name);
  return new;
end $$;
drop trigger if exists acq_companies_keys_trg on public.acq_companies;
create trigger acq_companies_keys_trg before insert or update of name on public.acq_companies
  for each row execute function public.acq_companies_keys();

-- Backfill existing (Australian property-management) rows.
update public.acq_companies c
   set country = coalesce(c.country, 'AU'),
       region = coalesce(c.region, c.state),
       industry = coalesce(c.industry, 'Property management'),
       market_id = coalesce(c.market_id, (select id from public.acq_markets where name = 'Property management - Australia')),
       name_key = public.acq_name_key(c.name);

create index if not exists acq_companies_name_key_idx on public.acq_companies (name_key, country);
create index if not exists acq_companies_market_idx on public.acq_companies (market_id, status);
create index if not exists acq_companies_dup_idx on public.acq_companies (possible_duplicate_of) where possible_duplicate_of is not null;

-- Flags (never merges) a company whose normalised name + country matches an older, different company.
create or replace function public.acq_flag_duplicate(p_company_id uuid)
returns uuid language plpgsql as $$
declare c public.acq_companies; keeper uuid;
begin
  select * into c from public.acq_companies where id = p_company_id;
  if c.id is null or c.duplicate_dismissed or c.name_key is null or c.name_key = '' then return null; end if;
  select o.id into keeper from public.acq_companies o
   where o.id <> c.id and o.name_key = c.name_key
     and coalesce(o.country, '') = coalesce(c.country, '')
     and o.status <> 'archived'
     and (o.created_at < c.created_at or (o.created_at = c.created_at and o.id < c.id))
   order by o.created_at, o.id limit 1;
  update public.acq_companies set possible_duplicate_of = keeper where id = c.id and possible_duplicate_of is distinct from keeper;
  return keeper;
end $$;

create or replace function public.acq_companies_flag_dup_trg()
returns trigger language plpgsql as $$
begin
  perform public.acq_flag_duplicate(new.id);
  return null;
end $$;
drop trigger if exists acq_companies_flag_dup on public.acq_companies;
create trigger acq_companies_flag_dup after insert on public.acq_companies
  for each row execute function public.acq_companies_flag_dup_trg();

-- Flag anything already in the table.
do $$ declare r record; begin
  for r in select id from public.acq_companies loop perform public.acq_flag_duplicate(r.id); end loop;
end $$;

-- Merge `dup` into `keeper`: contacts, research and suggestions move; the duplicate is archived (never deleted).
create or replace function public.acq_merge_companies(p_keeper uuid, p_dup uuid, p_actor text)
returns void language plpgsql as $$
begin
  if p_keeper = p_dup then raise exception 'cannot merge a company into itself'; end if;
  if not exists (select 1 from public.acq_companies where id = p_keeper) or not exists (select 1 from public.acq_companies where id = p_dup) then
    raise exception 'company not found';
  end if;
  update public.acq_contacts set company_id = p_keeper where company_id = p_dup;
  update public.acq_research_records set company_id = p_keeper where company_id = p_dup;
  delete from public.acq_contact_suggestions s where s.company_id = p_dup
     and exists (select 1 from public.acq_contact_suggestions k where k.company_id = p_keeper and k.email_normalized = s.email_normalized);
  update public.acq_contact_suggestions set company_id = p_keeper where company_id = p_dup;
  -- Fill gaps on the keeper from the duplicate; never overwrite existing keeper data.
  update public.acq_companies k set
      website = coalesce(k.website, d.website), domain = k.domain, linkedin_url = coalesce(k.linkedin_url, d.linkedin_url),
      suburb = coalesce(k.suburb, d.suburb), region = coalesce(k.region, d.region)
    from public.acq_companies d where k.id = p_keeper and d.id = p_dup;
  update public.acq_companies set status = 'archived', possible_duplicate_of = p_keeper, duplicate_dismissed = true, domain = null where id = p_dup;
  update public.acq_companies set possible_duplicate_of = null where possible_duplicate_of = p_dup and id <> p_dup;
  insert into public.acq_audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (p_actor, 'company.merged', 'company', p_keeper, jsonb_build_object('merged_company_id', p_dup));
end $$;

-- ---------------------------------------------------------------------------
-- RLS: no policies; only the service role may touch these tables/functions.
-- ---------------------------------------------------------------------------
do $$
declare t text; r text; f text;
begin
  foreach t in array array['acq_markets','acq_country_rules']
  loop
    execute format('alter table public.%I enable row level security', t);
    foreach r in array array['anon','authenticated'] loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke all on public.%I from %I', t, r);
      end if;
    end loop;
  end loop;
  foreach f in array array['acq_merge_companies(uuid,uuid,text)','acq_flag_duplicate(uuid)','acq_country_allowed(text)']
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

-- ---------------------------------------------------------------------------
-- Country gate on sending. A contact may be emailed only when its company's country has an enabled
-- rule. Unknown company/country is blocked (fail closed).
-- ---------------------------------------------------------------------------
create or replace function public.acq_company_country_ok(p_company_id uuid)
returns boolean language sql stable as $$
  select coalesce((select public.acq_country_allowed(c.country) from public.acq_companies c where c.id = p_company_id), false)
$$;

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
  -- The contact's company country must have an enabled email rule (fail closed when unknown).
  if not public.acq_company_country_ok(ct.company_id) then return query select false, 'country_blocked'; return; end if;
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

do $$
declare r text;
begin
  revoke execute on function public.acq_company_country_ok(uuid) from public;
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on function public.acq_company_country_ok(uuid) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.acq_company_country_ok(uuid) to service_role;
    grant execute on function public.acq_reserve_send(uuid) to service_role;
  end if;
end $$;
