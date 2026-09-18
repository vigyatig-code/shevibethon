/*
# Enable pg_cron + pg_net and schedule news fetching

1. Extensions
- Enable `pg_cron` for scheduled job execution.
- Enable `pg_net` for HTTP requests from within the database (Supabase's native HTTP extension).

2. Scheduled Jobs
- Create a cron job named `fetch-news-job` that runs every 20 minutes.
- It calls the `fetch-news` edge function via `net.http_post` with the anon key for authorization.
- The edge function fetches Google News RSS for 6 civic categories and upserts articles into the `news` table.

3. Important Notes
- pg_cron schedules are managed in the `cron` schema.
- The job is unscheduled first if it already exists (idempotent migration).
- The anon key is passed via the Authorization header so the Supabase gateway routes the request correctly, even though verify_jwt=false on the function.
*/
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('fetch-news-job');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

SELECT cron.schedule(
  'fetch-news-job',
  '*/20 * * * *',
  $$
    SELECT net.http_post(
      url := 'https://db.kwzcxrjzdfdlvobcwhpv.supabase.co/functions/v1/fetch-news',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5MzQxMjQxMjQsImlhdCI6MTcwOTI1MjQyNH0.M2Y2NjU5NjU2NjU2NjU2NjU2NjU2NjU2NjU2NjU2NjU'
      ),
      body := '{}'::jsonb
    );
  $$
);
