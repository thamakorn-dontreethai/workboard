-- Every-5-minutes trigger for appointment reminders, run by Supabase rather
-- than Vercel Cron (Hobby plans only allow daily crons). Calls the GET
-- handler in app/api/appointments/check-reminders/route.ts.
--
-- Run once in the Supabase SQL Editor. Before running, replace
-- <CRON_SECRET> below with the same value set in Vercel's env vars; it is
-- stored in Supabase Vault so it never lives in this repo.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select vault.create_secret('<CRON_SECRET>', 'cron_secret');

select cron.schedule(
  'appointment-reminders',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://workboard-liart.vercel.app/api/appointments/check-reminders',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 30000
  );
  $$
);

-- Check recent runs / responses:
--   select * from cron.job_run_details order by start_time desc limit 10;
--   select status_code, content from net._http_response order by created desc limit 10;
-- Remove:
--   select cron.unschedule('appointment-reminders');
