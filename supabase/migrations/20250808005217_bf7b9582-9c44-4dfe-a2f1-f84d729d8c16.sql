-- Enable required extensions and schedule hourly aggregation
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create or replace a scheduled job to aggregate today's events every hour
select
  cron.schedule(
    'aggregate-api-usage-hourly',
    '5 * * * *', -- at minute 5 every hour
    $$
    select
      net.http_post(
        url := 'https://wgwmzfbnkovumqcvsxgd.supabase.co/functions/v1/aggregate-api-usage',
        headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indnd216ZmJua292dW1xY3ZzeGdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwODg1MjcsImV4cCI6MjA2MTY2NDUyN30.HVv6TGHC5jDiEWChIyo_jp60Ef7Vtwc0x3zPKyDt4bE"}'::jsonb,
        body := jsonb_build_object('date', to_char(now() at time zone 'UTC', 'YYYY-MM-DD'))
      );
    $$
  );