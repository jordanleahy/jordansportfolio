-- Backfill user_usage_tracking rows for all users for the current billing period
-- Uses subscription period when available, otherwise defaults to calendar month

-- 1) Build target periods per user
WITH current_period AS (
  SELECT 
    u.id AS user_id,
    COALESCE(us.current_period_start, date_trunc('month', now())) AS start_at,
    COALESCE(us.current_period_end, (date_trunc('month', now()) + interval '1 month')) AS end_at
  FROM auth.users u
  LEFT JOIN public.user_subscriptions us 
    ON us.user_id = u.id AND COALESCE(us.status, 'active') = 'active'
)
-- 2) Insert missing usage rows with zeroed counters
INSERT INTO public.user_usage_tracking (
  user_id,
  billing_period_start,
  billing_period_end,
  image_generations_used,
  dalle_images_used,
  text_generations_used,
  gpt_images_used,
  daily_usage_date,
  gpt_images_used_today
)
SELECT 
  cp.user_id,
  cp.start_at,
  cp.end_at,
  0, -- image_generations_used
  0, -- dalle_images_used
  0, -- text_generations_used
  0, -- gpt_images_used
  current_date, -- daily_usage_date
  0  -- gpt_images_used_today
FROM current_period cp
ON CONFLICT (user_id, billing_period_start) DO NOTHING;

-- 3) Ensure existing rows have a daily date
UPDATE public.user_usage_tracking 
SET daily_usage_date = current_date 
WHERE daily_usage_date IS NULL;