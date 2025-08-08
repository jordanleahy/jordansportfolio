-- 1) Utility function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2) Raw events table for unified API usage
CREATE TABLE IF NOT EXISTS public.api_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',
  service TEXT,                               -- e.g., chat, images
  function_name TEXT NOT NULL,
  model_used TEXT,
  request_type TEXT NOT NULL,                  -- e.g., text_generation | image_generation | image_prompt
  tokens_used INTEGER,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  image_size TEXT,
  image_quality TEXT,
  estimated_cost NUMERIC NOT NULL DEFAULT 0,
  actual_cost NUMERIC,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,
  http_status INTEGER,
  response_time_ms INTEGER,
  correlation_id TEXT,
  openai_request_id TEXT,
  request_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_email TEXT,
  user_name TEXT
);

-- Enable RLS
ALTER TABLE public.api_usage_events ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_usage_events' AND policyname='Service role can manage api usage events'
  ) THEN
    CREATE POLICY "Service role can manage api usage events"
    ON public.api_usage_events FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_usage_events' AND policyname='Users can insert their own api usage events'
  ) THEN
    CREATE POLICY "Users can insert their own api usage events"
    ON public.api_usage_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_usage_events' AND policyname='Users can view their own api usage events'
  ) THEN
    CREATE POLICY "Users can view their own api usage events"
    ON public.api_usage_events FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_events_created_at ON public.api_usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_user_id ON public.api_usage_events (user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_fn_reqtype ON public.api_usage_events (function_name, request_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_events_provider ON public.api_usage_events (provider);

-- 3) Daily aggregates table
CREATE TABLE IF NOT EXISTS public.api_usage_daily_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  user_id UUID,
  provider TEXT NOT NULL DEFAULT 'openai',
  service TEXT,
  function_name TEXT,
  model_used TEXT,
  request_type TEXT,
  total_requests INTEGER NOT NULL DEFAULT 0,
  total_success INTEGER NOT NULL DEFAULT 0,
  total_errors INTEGER NOT NULL DEFAULT 0,
  success_rate NUMERIC NOT NULL DEFAULT 0,
  total_prompt_tokens BIGINT NOT NULL DEFAULT 0,
  total_completion_tokens BIGINT NOT NULL DEFAULT 0,
  total_tokens BIGINT NOT NULL DEFAULT 0,
  total_estimated_cost NUMERIC NOT NULL DEFAULT 0,
  total_actual_cost NUMERIC,
  avg_latency_ms NUMERIC,
  p95_latency_ms NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  agg_key TEXT GENERATED ALWAYS AS (
    to_char(date,'YYYY-MM-DD') || '|' || coalesce(user_id::text,'-') || '|' || coalesce(provider,'-') || '|' || coalesce(service,'-') || '|' || coalesce(function_name,'-') || '|' || coalesce(model_used,'-') || '|' || coalesce(request_type,'-')
  ) STORED
);

-- Uniqueness for upserts
CREATE UNIQUE INDEX IF NOT EXISTS ux_api_usage_daily_aggregates_agg_key ON public.api_usage_daily_aggregates(agg_key);

-- Trigger to maintain updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_api_usage_daily_aggregates_updated_at'
  ) THEN
    CREATE TRIGGER trg_api_usage_daily_aggregates_updated_at
    BEFORE UPDATE ON public.api_usage_daily_aggregates
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- RLS for aggregates
ALTER TABLE public.api_usage_daily_aggregates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_usage_daily_aggregates' AND policyname='Service role can manage daily aggregates'
  ) THEN
    CREATE POLICY "Service role can manage daily aggregates"
    ON public.api_usage_daily_aggregates FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_usage_daily_aggregates' AND policyname='Admins can view all daily aggregates'
  ) THEN
    CREATE POLICY "Admins can view all daily aggregates"
    ON public.api_usage_daily_aggregates FOR SELECT
    USING (has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='api_usage_daily_aggregates' AND policyname='Users can view their own daily aggregates'
  ) THEN
    CREATE POLICY "Users can view their own daily aggregates"
    ON public.api_usage_daily_aggregates FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_daily_aggregates_date ON public.api_usage_daily_aggregates (date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_daily_aggregates_user ON public.api_usage_daily_aggregates (user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_daily_aggregates_fn ON public.api_usage_daily_aggregates (function_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_daily_aggregates_reqtype ON public.api_usage_daily_aggregates (request_type);
