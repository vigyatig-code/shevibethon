/*
# Fix cron job URL and auth key

1. Changes
- Unschedule the previously created `fetch-news-job` which had an incorrect URL and placeholder anon key.
- Reschedule with the correct project URL and the actual anon key from the project environment.

2. Important Notes
- The edge function URL is https://dindoxvewtfveqbqsfwx.supabase.co/functions/v1/fetch-news
- The anon key is required for the Supabase gateway to route the request, even though verify_jwt=false.
*/
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
      url := 'https://dindoxvewtfveqbqsfwx.supabase.co/functions/v1/fetch-news',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpbmRveHZld3RmdmVxYnFzZnd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkyMzMwNjEsImV4cCI6MjEwNDgwOTA2MX0.v53L42pFBDaCfN17tSz1Ym6UK1ZxPDT8naVgofqk0JU'
      ),
      body := '{}'::jsonb
    );
  $$
);
