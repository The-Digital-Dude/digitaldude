-- 0043: per-rep daily sending limits (cold and follow-up kept separate) with an optional warm-up ramp.
-- Run in the Supabase SQL editor. Safe to run again.
--
--  * employees.daily_outreach_limit (already there) is now the rep's COLD maximum per rolling 24 hours.
--  * employees.followup_daily_limit is the rep's FOLLOW-UP maximum, protected from cold sending.
--  * With limit_warmup on, the limits start low and rise every week up to those maximums (settings: acq_settings "send_limits").
--  * rep_outreach_logs.stage records whether each email was cold or a follow-up, so each is counted on its own.

do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'employees' and column_name = 'limit_warmup') then
    alter table public.employees
      add column followup_daily_limit integer not null default 30,
      add column limit_warmup boolean not null default true,
      add column limit_started_at timestamptz not null default now();
    -- Reps who already send keep their current limits: the warm-up applies to reps added from now on.
    update public.employees set limit_warmup = false;
  end if;
end $$;

alter table public.rep_outreach_logs
  add column if not exists stage text not null default 'cold';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'rep_outreach_logs_stage_check') then
    alter table public.rep_outreach_logs add constraint rep_outreach_logs_stage_check check (stage in ('cold', 'follow_up'));
  end if;
end $$;

create index if not exists rep_outreach_logs_emp_sent_idx on public.rep_outreach_logs (employee_id, sent_at desc);
