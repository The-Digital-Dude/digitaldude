-- Migration: 0031_offboarding_outreach
-- P5: when a rep is offboarded (or deleted) their running outreach stops as well as their pool companies being
-- released: campaigns paused, active drip enrolments cancelled, pending queued emails cancelled.
-- Works whether or not the rep outreach tables exist (they are checked dynamically). Requires 0027.

create or replace function public.acq_stop_rep_outreach(p_employee uuid)
returns integer language plpgsql as $$
declare n integer := 0; k integer;
begin
  if to_regclass('public.rep_campaign_queue') is not null then
    execute 'update public.rep_campaign_queue set status = ''cancelled'', error_message = ''Rep offboarded'' where rep_id = $1 and status = ''pending''' using p_employee;
    get diagnostics k = row_count; n := n + k;
  end if;
  if to_regclass('public.rep_campaign_enrollments') is not null then
    execute 'update public.rep_campaign_enrollments set status = ''cancelled_manual'' where rep_id = $1 and status = ''active''' using p_employee;
    get diagnostics k = row_count; n := n + k;
  end if;
  if to_regclass('public.rep_campaigns') is not null then
    execute 'update public.rep_campaigns set status = ''paused'' where rep_id = $1 and status = ''active''' using p_employee;
    get diagnostics k = row_count; n := n + k;
  end if;
  return n;
end $$;

create or replace function public.acq_employee_offboard_trg()
returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    perform public.acq_release_employee_companies(old.id, 'system:employee_deleted');
    perform public.acq_stop_rep_outreach(old.id);
    return old;
  end if;
  if new.status = 'offboarded' and old.status is distinct from 'offboarded' then
    perform public.acq_release_employee_companies(new.id, 'system:offboarded');
    perform public.acq_stop_rep_outreach(new.id);
  end if;
  return new;
end $$;

do $$
declare r text;
begin
  revoke execute on function public.acq_stop_rep_outreach(uuid) from public;
  foreach r in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('revoke execute on function public.acq_stop_rep_outreach(uuid) from %I', r);
    end if;
  end loop;
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.acq_stop_rep_outreach(uuid) to service_role;
  end if;
end $$;
