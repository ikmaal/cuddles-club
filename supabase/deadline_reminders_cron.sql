-- Deadline reminders cron — run once in Supabase SQL Editor.
-- Schedule: daily at 01:00 UTC (9:00 AM Singapore)
--
-- Before running:
-- 1. Replace PASTE_SERVICE_ROLE_KEY_HERE with your service_role key
--    (Dashboard → Project Settings → API → service_role → Reveal)
-- 2. Click Run

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema extensions;

-- Store auth in Vault (skip if secret already exists and cron is working)
select vault.create_secret(
  'PASTE_SERVICE_ROLE_KEY_HERE',
  'deadline_reminders_service_role_key',
  'Auth for deadline-reminders Edge Function cron'
);

-- Upsert: same job name replaces any previous schedule
select cron.schedule(
  'deadline-reminders-daily',
  '0 1 * * *',
  $$
  select net.http_post(
    url := 'https://akuimyczxpdpogknadrc.supabase.co/functions/v1/deadline-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'deadline_reminders_service_role_key'
        limit 1
      )
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 10000
  ) as request_id;
  $$
);

-- Confirm the job exists
select jobname, schedule, active
from cron.job
where jobname = 'deadline-reminders-daily';
