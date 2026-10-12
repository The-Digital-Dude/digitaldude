-- Migration: 0025_rep_security_shared_suppression
-- P0 of the global lead pool work:
--  1. Enable row level security (no policies) on every rep_* table so the public anon key can
--     never read or write them. The server uses the service role, which bypasses RLS.
--  2. Carry existing rep opt-outs into the one shared suppression list (acq_suppressions).
--  3. Default sender identity used in every rep email footer (editable in admin settings).
-- Requires 0022 (acq_suppressions, acq_settings) to be applied first.

do $$
declare t text; r text;
begin
  foreach t in array array[
    'rep_leads','rep_audit_logs','rep_outreach_logs','rep_email_templates',
    'rep_campaigns','rep_campaign_steps','rep_campaign_enrollments','rep_campaign_queue','rep_unsubscribes'
  ]
  loop
    if to_regclass('public.' || t) is not null then
      execute format('alter table public.%I enable row level security', t);
      foreach r in array array['anon','authenticated'] loop
        if exists (select 1 from pg_roles where rolname = r) then
          execute format('revoke all on public.%I from %I', t, r);
        end if;
      end loop;
    end if;
  end loop;
end $$;

-- Existing opt-outs become permanent shared suppressions (idempotent).
do $$
begin
  if to_regclass('public.rep_unsubscribes') is not null and to_regclass('public.acq_suppressions') is not null then
    insert into public.acq_suppressions (normalized_email, reason, source)
    select lower(btrim(u.email)), 'unsubscribe', 'legacy_rep_unsubscribe'
      from public.rep_unsubscribes u
     where u.email is not null and btrim(u.email) <> ''
    on conflict do nothing;
  end if;
end $$;

insert into public.acq_settings (key, value)
values ('sender_identity', '{"business":"The Digital Dude","postalAddress":""}'::jsonb)
on conflict (key) do nothing;
