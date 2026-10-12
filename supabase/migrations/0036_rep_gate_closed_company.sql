-- Migration: 0036_rep_gate_closed_company
-- A rep may not email a contact at a company that was closed out as lost or dead, the same rule the admin send gate
-- already applies (0033). Otherwise identical to the 0034 version. Requires 0022-0035.

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
  if co.pool_status in ('lost','dead') then return query select false, 'company_closed'; return; end if;
  if ct.status <> 'eligible' then return query select false, 'contact_not_eligible'; return; end if;
  if public.acq_is_suppressed(ct.email) then return query select false, 'suppressed'; return; end if;
  if not public.acq_contact_consent_ok(ct.id) then return query select false, 'consent_invalid'; return; end if;
  if public.acq_company_other_active(ct.id) then return query select false, 'company_has_active_contact'; return; end if;
  if not public.acq_country_allowed(co.country) then return query select false, 'country_blocked'; return; end if;
  return query select true, null::text;
end $$;

do $$
declare r text;
begin
  revoke execute on function public.acq_rep_can_email(uuid,uuid) from public;
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on function public.acq_rep_can_email(uuid,uuid) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.acq_rep_can_email(uuid,uuid) to service_role;
  end if;
end $$;
