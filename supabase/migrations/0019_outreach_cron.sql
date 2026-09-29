-- Migration: 0018_outreach_cron.sql
-- Description: Schedule the outreach drip queue processor via Supabase's
-- own pg_cron, calling the app's cron-secret-only API route on a fixed
-- interval, instead of relying on any rep/admin session to trigger it
-- manually (that fallback auth path has been removed from the route
-- itself in app/api/cron/process-outreach/route.ts).

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Remove any previous schedule of the same name so this migration is safe
-- to re-run.
select cron.unschedule('process-outreach-queue')
where exists (select 1 from cron.job where jobname = 'process-outreach-queue');

-- Runs every 15 minutes. REPLACE <CRON_SECRET> below with the actual value
-- of CRON_SECRET from Vercel/.env.local before running this in the SQL
-- Editor. Do not commit the real secret into this file — this repository
-- is public on GitHub, and a hardcoded credential here would repeat the
-- exact Meta CAPI token leak this project already had and fixed.
select cron.schedule(
  'process-outreach-queue',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://www.digitaldude.co.uk/api/cron/process-outreach',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <CRON_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
