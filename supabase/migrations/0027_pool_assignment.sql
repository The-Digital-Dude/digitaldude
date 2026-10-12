-- Migration: 0027_pool_assignment
-- P2 of the global lead pool: one owner per company, admin bulk assignment, rep claiming limited to
-- allowed markets with a cap, auto-assignment rules, and an append-only assignment history.
-- Requires 0022, 0023 and 0026, and the existing employees table.

alter table public.acq_companies
  add column if not exists owner_employee_id uuid references public.employees(id) on delete set null,
  add column if not exists assigned_at timestamptz,
  add column if not exists assignment_source text,
  add column if not exists pool_status text not null default 'unassigned';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'acq_companies_pool_status_check') then
    alter table public.acq_companies add constraint acq_companies_pool_status_check
      check (pool_status in ('unassigned','assigned','needs_contact','contacted','replied','meeting','won','lost','dead'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'acq_companies_assignment_source_check') then
    alter table public.acq_companies add constraint acq_companies_assignment_source_check
      check (assignment_source is null or assignment_source in ('admin','claim','rule'));
  end if;
  -- An unowned company can only be 'unassigned' or finished ('lost','dead'); an owned one is never 'unassigned'.
  if not exists (select 1 from pg_constraint where conname = 'acq_companies_owner_status_check') then
    alter table public.acq_companies add constraint acq_companies_owner_status_check
      check ((owner_employee_id is null and pool_status in ('unassigned','lost','dead','won'))
          or (owner_employee_id is not null and pool_status <> 'unassigned'));
  end if;
end $$;

create index if not exists acq_companies_owner_idx on public.acq_companies (owner_employee_id, pool_status);
create index if not exists acq_companies_pool_idx on public.acq_companies (pool_status, country);

create table if not exists public.acq_assignment_log (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.acq_companies(id) on delete cascade,
  from_employee_id uuid,
  to_employee_id uuid,
  action text not null check (action in ('assign','unassign','claim','rule','release')),
  actor text not null,
  created_at timestamptz not null default now()
);
create index if not exists acq_assignment_log_company_idx on public.acq_assignment_log (company_id, created_at desc);

-- Which markets a rep may claim from, and how many open companies they may hold.
create table if not exists public.acq_rep_markets (
  employee_id uuid not null references public.employees(id) on delete cascade,
  market_id uuid not null references public.acq_markets(id) on delete cascade,
  claim_cap integer not null default 25 check (claim_cap between 0 and 1000),
  created_at timestamptz not null default now(),
  primary key (employee_id, market_id)
);

-- Auto-assignment: first matching enabled rule (lowest priority number) owns a new unassigned company.
create table if not exists public.acq_assignment_rules (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  market_id uuid references public.acq_markets(id) on delete cascade,
  country text check (country is null or country ~ '^[A-Z]{2}$'),
  min_fit_score integer check (min_fit_score is null or min_fit_score between 0 and 100),
  priority integer not null default 100,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  constraint acq_rule_has_criteria check (market_id is not null or country is not null or min_fit_score is not null)
);

-- Assign (or, with a null employee, unassign) many companies in one transaction, logging each change.
create or replace function public.acq_assign_companies(p_company_ids uuid[], p_employee uuid, p_actor text, p_source text default 'admin')
returns integer language plpgsql as $$
declare c record; n integer := 0;
begin
  if p_employee is not null and not exists (select 1 from public.employees e where e.id = p_employee and e.status <> 'offboarded') then
    raise exception 'employee not found or offboarded';
  end if;
  for c in select id, owner_employee_id, pool_status from public.acq_companies
            where id = any(p_company_ids) and status <> 'archived' for update
  loop
    if p_employee is null then
      update public.acq_companies set owner_employee_id = null, assigned_at = null, assignment_source = null,
             pool_status = case when c.pool_status in ('won','lost','dead') then c.pool_status else 'unassigned' end
       where id = c.id;
      insert into public.acq_assignment_log (company_id, from_employee_id, to_employee_id, action, actor) values (c.id, c.owner_employee_id, null, 'unassign', p_actor);
    else
      update public.acq_companies set owner_employee_id = p_employee, assigned_at = now(), assignment_source = p_source,
             pool_status = case when c.pool_status in ('unassigned','won','lost','dead') then 'assigned' else c.pool_status end
       where id = c.id;
      insert into public.acq_assignment_log (company_id, from_employee_id, to_employee_id, action, actor)
      values (c.id, c.owner_employee_id, p_employee, case when p_source = 'rule' then 'rule' else 'assign' end, p_actor);
    end if;
    n := n + 1;
  end loop;
  return n;
end $$;

-- A rep claims one unowned company: needs the company's market in their allowed markets and room under their cap.
-- The employee row is locked so two simultaneous claims cannot exceed the cap, and the company row is locked
-- so two reps cannot both win it.
create or replace function public.acq_claim_company(p_company_id uuid, p_employee uuid)
returns table (ok boolean, reason text) language plpgsql as $$
declare e public.employees; c public.acq_companies; cap integer; held integer;
begin
  select * into e from public.employees where id = p_employee for update;
  if e.id is null or e.status = 'offboarded' or coalesce(e.onboarding_completed, false) = false then
    return query select false, 'rep_not_active'; return;
  end if;
  select * into c from public.acq_companies where id = p_company_id for update;
  if c.id is null or c.status = 'archived' then return query select false, 'company_not_found'; return; end if;
  if c.owner_employee_id is not null then return query select false, 'already_owned'; return; end if;
  if c.pool_status <> 'unassigned' then return query select false, 'not_claimable'; return; end if;
  if c.market_id is null then return query select false, 'no_market'; return; end if;
  select m.claim_cap into cap from public.acq_rep_markets m where m.employee_id = p_employee and m.market_id = c.market_id;
  if cap is null then return query select false, 'market_not_allowed'; return; end if;
  select count(*) into held from public.acq_companies o
   where o.owner_employee_id = p_employee and o.pool_status in ('assigned','needs_contact','contacted');
  if held >= cap then return query select false, 'claim_cap_reached'; return; end if;

  update public.acq_companies set owner_employee_id = p_employee, assigned_at = now(), assignment_source = 'claim', pool_status = 'assigned' where id = c.id;
  insert into public.acq_assignment_log (company_id, from_employee_id, to_employee_id, action, actor) values (c.id, null, p_employee, 'claim', 'rep:' || p_employee::text);
  return query select true, null::text;
end $$;

-- Applies the first matching enabled rule to an unowned company. Returns the employee assigned, or null.
create or replace function public.acq_apply_assignment_rules(p_company_id uuid)
returns uuid language plpgsql as $$
declare c public.acq_companies; r public.acq_assignment_rules;
begin
  select * into c from public.acq_companies where id = p_company_id;
  if c.id is null or c.owner_employee_id is not null or c.status = 'archived' or c.pool_status <> 'unassigned' then return null; end if;
  select * into r from public.acq_assignment_rules x
   where x.enabled
     and (x.market_id is null or x.market_id = c.market_id)
     and (x.country is null or x.country = c.country)
     and (x.min_fit_score is null or coalesce(c.fit_score, -1) >= x.min_fit_score)
     and exists (select 1 from public.employees e where e.id = x.employee_id and e.status <> 'offboarded')
   order by x.priority, x.created_at limit 1;
  if r.id is null then return null; end if;
  perform public.acq_assign_companies(array[c.id], r.employee_id, 'rule', 'rule');
  return r.employee_id;
end $$;

-- When a rep is offboarded or deleted, their companies return to the pool (history is kept, nothing is deleted).
create or replace function public.acq_release_employee_companies(p_employee uuid, p_actor text)
returns integer language plpgsql as $$
declare c record; n integer := 0;
begin
  for c in select id, pool_status from public.acq_companies where owner_employee_id = p_employee for update loop
    update public.acq_companies set owner_employee_id = null, assigned_at = null, assignment_source = null,
           pool_status = case when c.pool_status in ('won','lost','dead') then c.pool_status else 'unassigned' end
     where id = c.id;
    insert into public.acq_assignment_log (company_id, from_employee_id, to_employee_id, action, actor) values (c.id, p_employee, null, 'release', p_actor);
    n := n + 1;
  end loop;
  return n;
end $$;

create or replace function public.acq_employee_offboard_trg()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform public.acq_release_employee_companies(old.id, 'system:employee_deleted');
    return old;
  end if;
  if new.status = 'offboarded' and old.status is distinct from 'offboarded' then
    perform public.acq_release_employee_companies(new.id, 'system:offboarded');
  end if;
  return new;
end $$;
drop trigger if exists acq_employee_offboard_upd on public.employees;
create trigger acq_employee_offboard_upd after update of status on public.employees
  for each row execute function public.acq_employee_offboard_trg();
drop trigger if exists acq_employee_offboard_del on public.employees;
create trigger acq_employee_offboard_del before delete on public.employees
  for each row execute function public.acq_employee_offboard_trg();

-- Contact count per company (filterable "needs contact" queue without aggregate queries).
alter table public.acq_companies add column if not exists contact_count integer not null default 0;

create or replace function public.acq_contacts_count_trg()
returns trigger language plpgsql as $$
begin
  if tg_op in ('UPDATE','DELETE') and old.company_id is not null then
    update public.acq_companies set contact_count = (select count(*) from public.acq_contacts where company_id = old.company_id) where id = old.company_id;
  end if;
  if tg_op in ('INSERT','UPDATE') and new.company_id is not null and (tg_op = 'INSERT' or new.company_id is distinct from old.company_id) then
    update public.acq_companies set contact_count = (select count(*) from public.acq_contacts where company_id = new.company_id) where id = new.company_id;
  end if;
  return null;
end $$;
drop trigger if exists acq_contacts_count on public.acq_contacts;
create trigger acq_contacts_count after insert or update of company_id or delete on public.acq_contacts
  for each row execute function public.acq_contacts_count_trg();

update public.acq_companies c set contact_count = (select count(*) from public.acq_contacts k where k.company_id = c.id);
create index if not exists acq_companies_contact_count_idx on public.acq_companies (contact_count);

-- RLS: no policies; service role only.
do $$
declare t text; r text; f text;
begin
  foreach t in array array['acq_assignment_log','acq_rep_markets','acq_assignment_rules']
  loop
    execute format('alter table public.%I enable row level security', t);
    foreach r in array array['anon','authenticated'] loop
      if exists (select 1 from pg_roles where rolname = r) then
        execute format('revoke all on public.%I from %I', t, r);
      end if;
    end loop;
  end loop;
  foreach f in array array['acq_assign_companies(uuid[],uuid,text,text)','acq_claim_company(uuid,uuid)','acq_apply_assignment_rules(uuid)','acq_release_employee_companies(uuid,text)']
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
