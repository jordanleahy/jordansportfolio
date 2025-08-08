-- Make tier checks case-insensitive in aggregation functions

CREATE OR REPLACE FUNCTION public.refresh_monthly_aggregates(
  target_month DATE DEFAULT NULL,
  target_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  processed_count INTEGER := 0;
  user_record RECORD;
  month_start DATE;
BEGIN
  month_start := COALESCE(target_month, date_trunc('month', CURRENT_DATE)::DATE);

  FOR user_record IN
    SELECT DISTINCT u.user_id, st.name as subscription_tier
    FROM user_subscriptions u
    JOIN subscription_tiers st ON u.tier_id = st.id
    WHERE u.status = 'active'
      AND lower(st.name) IN ('starter', 'admin')
      AND (target_user_id IS NULL OR u.user_id = target_user_id)
  LOOP
    INSERT INTO api_usage_monthly_aggregates (
      user_id, month_year, subscription_tier_name,
      total_requests, successful_requests, failed_requests,
      image_generations, text_generations, total_cost, total_tokens
    )
    SELECT 
      user_record.user_id,
      month_start,
      user_record.subscription_tier,
      COUNT(*)::int,
      COUNT(*) FILTER (WHERE success = true)::int,
      COUNT(*) FILTER (WHERE success = false)::int,
      COUNT(*) FILTER (WHERE request_type = 'image_generation')::int,
      COUNT(*) FILTER (WHERE request_type = 'text_generation')::int,
      COALESCE(SUM(estimated_cost), 0)::numeric(10,4),
      COALESCE(SUM(total_tokens), 0)::int
    FROM api_usage_tracking
    WHERE user_id = user_record.user_id
      AND created_at >= month_start
      AND created_at < (month_start + INTERVAL '1 month')
    ON CONFLICT (user_id, month_year)
    DO UPDATE SET
      total_requests = EXCLUDED.total_requests,
      successful_requests = EXCLUDED.successful_requests,
      failed_requests = EXCLUDED.failed_requests,
      image_generations = EXCLUDED.image_generations,
      text_generations = EXCLUDED.text_generations,
      total_cost = EXCLUDED.total_cost,
      total_tokens = EXCLUDED.total_tokens,
      updated_at = now();

    processed_count := processed_count + 1;
  END LOOP;

  RETURN processed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_monthly_aggregate_on_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  month_start DATE;
  tier_name TEXT;
BEGIN
  month_start := date_trunc('month', NEW.created_at)::DATE;

  SELECT st.name INTO tier_name
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = NEW.user_id
    AND us.status = 'active'
  LIMIT 1;

  IF lower(tier_name) IN ('starter', 'admin') THEN
    PERFORM get_or_create_monthly_aggregate(NEW.user_id, month_start);

    UPDATE api_usage_monthly_aggregates
    SET 
      total_requests = total_requests + 1,
      successful_requests = successful_requests + CASE WHEN NEW.success THEN 1 ELSE 0 END,
      failed_requests = failed_requests + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
      image_generations = image_generations + CASE WHEN NEW.request_type = 'image_generation' THEN 1 ELSE 0 END,
      text_generations = text_generations + CASE WHEN NEW.request_type = 'text_generation' THEN 1 ELSE 0 END,
      total_cost = total_cost + COALESCE(NEW.estimated_cost, 0),
      total_tokens = total_tokens + COALESCE(NEW.total_tokens, 0),
      updated_at = now()
    WHERE user_id = NEW.user_id AND month_year = month_start;
  END IF;

  RETURN NEW;
END;
$$;