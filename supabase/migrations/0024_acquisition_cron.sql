-- Migration: 0024_acquisition_cron
-- Runs the acquisition worker (sending, replies, daily discovery/research) every 10 minutes
-- via Supabase pg_cron, calling the cron-secret-only route.
-- REPLACE <CRON_SECRET> with the real CRON_SECRET value before running this in the SQL Editor.
-- NEVER commit the real secret: this repository is public.

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

select cron.unschedule('acquisition-worker')
where exists (select 1 from cron.job where jobname = 'acquisition-worker');

select cron.schedule(
  'acquisition-worker',
  '*/10 * * * *',
  $$
  select net.http_post(
    url := 'https://www.digitaldude.co.uk/api/acquisition/cron/worker',
    headers := jsonb_build_object(
      'Authorization', 'Bearer <CRON_SECRET>',
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
