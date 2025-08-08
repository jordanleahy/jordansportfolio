-- Phase 1: Create api_usage_monthly_aggregates table and supporting functions

-- Create the monthly aggregates table
CREATE TABLE public.api_usage_monthly_aggregates (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    month_year DATE NOT NULL, -- First day of month (e.g., '2025-08-01')
    subscription_tier_name TEXT NOT NULL,
    total_requests INTEGER NOT NULL DEFAULT 0,
    successful_requests INTEGER NOT NULL DEFAULT 0,
    failed_requests INTEGER NOT NULL DEFAULT 0,
    image_generations INTEGER NOT NULL DEFAULT 0,
    text_generations INTEGER NOT NULL DEFAULT 0,
    total_cost NUMERIC(10,4) NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, month_year)
);

-- Enable RLS
ALTER TABLE public.api_usage_monthly_aggregates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own monthly aggregates" 
ON public.api_usage_monthly_aggregates 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all monthly aggregates" 
ON public.api_usage_monthly_aggregates 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage monthly aggregates" 
ON public.api_usage_monthly_aggregates 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX idx_monthly_aggregates_user_month ON public.api_usage_monthly_aggregates(user_id, month_year);
CREATE INDEX idx_monthly_aggregates_month ON public.api_usage_monthly_aggregates(month_year);
CREATE INDEX idx_monthly_aggregates_tier ON public.api_usage_monthly_aggregates(subscription_tier_name);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_monthly_aggregates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_monthly_aggregates_updated_at
  BEFORE UPDATE ON public.api_usage_monthly_aggregates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monthly_aggregates_updated_at();

-- Function to get or create monthly aggregate record
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_aggregate(
  target_user_id UUID,
  target_month DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  aggregate_id UUID;
  tier_name TEXT;
BEGIN
  -- Get user's current subscription tier
  SELECT st.name INTO tier_name
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = target_user_id
    AND us.status = 'active'
  LIMIT 1;
  
  -- Default to 'free' if no active subscription
  tier_name := COALESCE(tier_name, 'free');
  
  -- Try to get existing record
  SELECT id INTO aggregate_id
  FROM public.api_usage_monthly_aggregates
  WHERE user_id = target_user_id 
    AND month_year = target_month;
  
  -- Create if doesn't exist
  IF aggregate_id IS NULL THEN
    INSERT INTO public.api_usage_monthly_aggregates (
      user_id, 
      month_year, 
      subscription_tier_name
    ) VALUES (
      target_user_id, 
      target_month, 
      tier_name
    ) RETURNING id INTO aggregate_id;
  END IF;
  
  RETURN aggregate_id;
END;
$$;

-- Function to refresh monthly aggregates for backfilling
CREATE OR REPLACE FUNCTION public.refresh_monthly_aggregates(
  target_month DATE DEFAULT NULL,
  target_user_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  processed_count INTEGER := 0;
  user_record RECORD;
  month_start DATE;
  month_end DATE;
  tier_name TEXT;
BEGIN
  -- If no target month specified, use current month
  month_start := COALESCE(target_month, date_trunc('month', CURRENT_DATE)::DATE);
  month_end := month_start + INTERVAL '1 month' - INTERVAL '1 day';
  
  -- Process specific user or all users with starter/admin subscriptions
  FOR user_record IN
    SELECT DISTINCT u.user_id, st.name as subscription_tier
    FROM user_subscriptions u
    JOIN subscription_tiers st ON u.tier_id = st.id
    WHERE u.status = 'active'
      AND st.name IN ('starter', 'admin')
      AND (target_user_id IS NULL OR u.user_id = target_user_id)
  LOOP
    -- Upsert monthly aggregate
    INSERT INTO public.api_usage_monthly_aggregates (
      user_id,
      month_year,
      subscription_tier_name,
      total_requests,
      successful_requests,
      failed_requests,
      image_generations,
      text_generations,
      total_cost,
      total_tokens
    )
    SELECT 
      user_record.user_id,
      month_start,
      user_record.subscription_tier,
      COUNT(*) as total_requests,
      COUNT(*) FILTER (WHERE success = true) as successful_requests,
      COUNT(*) FILTER (WHERE success = false) as failed_requests,
      COUNT(*) FILTER (WHERE request_type = 'image_generation') as image_generations,
      COUNT(*) FILTER (WHERE request_type = 'text_generation') as text_generations,
      COALESCE(SUM(estimated_cost), 0) as total_cost,
      COALESCE(SUM(total_tokens), 0) as total_tokens
    FROM api_usage_tracking
    WHERE user_id = user_record.user_id
      AND created_at >= month_start
      AND created_at <= month_end
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

-- Function to update monthly aggregates when new usage is tracked
CREATE OR REPLACE FUNCTION public.update_monthly_aggregate_on_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  month_start DATE;
  tier_name TEXT;
BEGIN
  -- Get the month start date
  month_start := date_trunc('month', NEW.created_at)::DATE;
  
  -- Get user's current subscription tier
  SELECT st.name INTO tier_name
  FROM user_subscriptions us
  JOIN subscription_tiers st ON us.tier_id = st.id
  WHERE us.user_id = NEW.user_id
    AND us.status = 'active'
  LIMIT 1;
  
  -- Only process starter and admin users
  IF tier_name IN ('starter', 'admin') THEN
    -- Ensure aggregate record exists
    PERFORM public.get_or_create_monthly_aggregate(NEW.user_id, month_start);
    
    -- Update the aggregate
    UPDATE public.api_usage_monthly_aggregates
    SET 
      total_requests = total_requests + 1,
      successful_requests = successful_requests + CASE WHEN NEW.success THEN 1 ELSE 0 END,
      failed_requests = failed_requests + CASE WHEN NOT NEW.success THEN 1 ELSE 0 END,
      image_generations = image_generations + CASE WHEN NEW.request_type = 'image_generation' THEN 1 ELSE 0 END,
      text_generations = text_generations + CASE WHEN NEW.request_type = 'text_generation' THEN 1 ELSE 0 END,
      total_cost = total_cost + COALESCE(NEW.estimated_cost, 0),
      total_tokens = total_tokens + COALESCE(NEW.total_tokens, 0),
      updated_at = now()
    WHERE user_id = NEW.user_id 
      AND month_year = month_start;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on api_usage_tracking
CREATE TRIGGER update_monthly_aggregate_on_new_usage
  AFTER INSERT ON public.api_usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION public.update_monthly_aggregate_on_usage();