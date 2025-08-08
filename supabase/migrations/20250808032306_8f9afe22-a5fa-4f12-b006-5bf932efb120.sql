-- Ensure realtime updates carry full row data for UPDATE events
ALTER TABLE public.api_usage_tracking REPLICA IDENTITY FULL;

-- Ensure the table is part of the realtime publication
DO $$
BEGIN
  BEGIN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.api_usage_tracking';
  EXCEPTION WHEN duplicate_object THEN
    -- Already added; ignore
    NULL;
  END;
END $$;

-- Optimize daily credit counting queries
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_user_success_type_created_at
  ON public.api_usage_tracking (user_id, created_at)
  WHERE success = true AND request_type IN ('image_generation','gpt_image_generation');