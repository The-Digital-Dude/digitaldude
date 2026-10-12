-- Claim cap fix: a rep could flip companies to replied/meeting/lost/dead (not counted) and claim again.
-- The cap now counts every non-archived company the rep owns except ones that were won.
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
   where o.owner_employee_id = p_employee and o.status <> 'archived' and o.pool_status <> 'won';
  if held >= cap then return query select false, 'claim_cap_reached'; return; end if;

  update public.acq_companies set owner_employee_id = p_employee, assigned_at = now(), assignment_source = 'claim', pool_status = 'assigned' where id = c.id;
  insert into public.acq_assignment_log (company_id, from_employee_id, to_employee_id, action, actor) values (c.id, null, p_employee, 'claim', 'rep:' || p_employee::text);
  return query select true, null::text;
end $$;
