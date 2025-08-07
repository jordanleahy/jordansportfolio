-- Enable pg_cron extension for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create cron job to run daily work summary generation at 8:30 PM
SELECT cron.schedule(
  'daily-work-summary-generation',
  '30 20 * * *', -- 8:30 PM every day
  $$
  SELECT
    net.http_post(
        url:='https://wgwmzfbnkovumqcvsxgd.supabase.co/functions/v1/generate-daily-work-summary',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);