-- Phase 3d: Database Constraints and Cleanup Utilities (Fixed SQL)

-- First, clean up existing duplicates
WITH duplicate_posts AS (
  SELECT 
    user_id,
    category,
    theme,
    id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY user_id, category, theme 
      ORDER BY created_at DESC
    ) as row_num
  FROM public.social_media_posts
  WHERE status != 'deleted'
)
UPDATE public.social_media_posts 
SET status = 'deleted', updated_at = now()
WHERE id IN (
  SELECT id 
  FROM duplicate_posts 
  WHERE row_num > 1
);

-- Add unique constraint for category+theme combination per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_user_category_theme 
ON public.social_media_posts (user_id, category, theme) 
WHERE status != 'deleted';

-- Add partial index for active theme submissions  
CREATE INDEX IF NOT EXISTS idx_theme_submissions_active 
ON public.theme_submissions (user_id, category, theme, created_at) 
WHERE status = 'completed';

-- Time-window constraint function
CREATE OR REPLACE FUNCTION public.enforce_theme_submission_time_window()
RETURNS TRIGGER AS $$
DECLARE
  recent_submission_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO recent_submission_count
  FROM public.theme_submissions
  WHERE user_id = NEW.user_id
    AND category = NEW.category
    AND theme = NEW.theme
    AND status = 'completed'
    AND created_at > (now() - interval '24 hours');
  
  IF recent_submission_count > 0 THEN
    RAISE EXCEPTION 'A theme with category "%" and theme "%" was already submitted within the last 24 hours', NEW.category, NEW.theme;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path TO 'public';

-- Add trigger for time-window constraint
DROP TRIGGER IF EXISTS tr_enforce_theme_time_window ON public.theme_submissions;
CREATE TRIGGER tr_enforce_theme_time_window
  BEFORE INSERT ON public.theme_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_theme_submission_time_window();

-- Function to find duplicate themes
CREATE OR REPLACE FUNCTION public.find_duplicate_themes(p_user_id uuid)
RETURNS TABLE(
  category text,
  theme text,
  duplicate_count bigint,
  latest_submission_id uuid,
  earliest_created_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.category,
    ts.theme,
    COUNT(*) as duplicate_count,
    MAX(ts.id) as latest_submission_id,
    MIN(ts.created_at) as earliest_created_at
  FROM public.theme_submissions ts
  WHERE ts.user_id = p_user_id
    AND ts.status = 'completed'
  GROUP BY ts.category, ts.theme
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, MIN(ts.created_at) ASC;
END;
$$;

-- Simplified cleanup function for duplicate posts
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_posts(
  p_user_id uuid,
  p_category text,
  p_theme text,
  p_keep_latest boolean DEFAULT true
)
RETURNS TABLE(
  action text,
  post_count integer,
  kept_posts integer,
  removed_posts integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_posts integer := 0;
  v_removed_posts integer := 0;
BEGIN
  -- Count total posts for this category+theme
  SELECT COUNT(*)
  INTO v_total_posts
  FROM public.social_media_posts
  WHERE user_id = p_user_id
    AND category = p_category
    AND theme = p_theme
    AND status != 'deleted';
  
  -- If no duplicates, return early
  IF v_total_posts <= 1 THEN
    RETURN QUERY SELECT 'no_duplicates'::text, v_total_posts, v_total_posts, 0;
    RETURN;
  END IF;
  
  -- Mark duplicates as deleted, keeping one based on preference
  IF p_keep_latest THEN
    -- Keep the most recent, delete the rest
    WITH posts_to_delete AS (
      SELECT id 
      FROM public.social_media_posts
      WHERE user_id = p_user_id
        AND category = p_category
        AND theme = p_theme
        AND status != 'deleted'
      ORDER BY created_at DESC
      OFFSET 1
    )
    UPDATE public.social_media_posts 
    SET status = 'deleted', updated_at = now()
    WHERE id IN (SELECT id FROM posts_to_delete);
  ELSE
    -- Keep the oldest, delete the rest
    WITH posts_to_delete AS (
      SELECT id 
      FROM public.social_media_posts
      WHERE user_id = p_user_id
        AND category = p_category
        AND theme = p_theme
        AND status != 'deleted'
      ORDER BY created_at ASC
      OFFSET 1
    )
    UPDATE public.social_media_posts 
    SET status = 'deleted', updated_at = now()
    WHERE id IN (SELECT id FROM posts_to_delete);
  END IF;
  
  GET DIAGNOSTICS v_removed_posts = ROW_COUNT;
  
  RETURN QUERY SELECT 'cleanup_completed'::text, v_total_posts, 1, v_removed_posts;
END;
$$;

-- Submission tracking table for analytics
CREATE TABLE IF NOT EXISTS public.submission_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  submission_id uuid REFERENCES public.theme_submissions(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('started', 'validated', 'ai_processed', 'imported', 'failed', 'duplicate_detected')),
  event_data jsonb DEFAULT '{}',
  processing_time_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- RLS policies for submission_logs
ALTER TABLE public.submission_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own submission logs"
ON public.submission_logs FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage submission logs"
ON public.submission_logs FOR ALL
USING (auth.role() = 'service_role');

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_submission_logs_user_event 
ON public.submission_logs (user_id, event_type, created_at);

CREATE INDEX IF NOT EXISTS idx_submission_logs_submission 
ON public.submission_logs (submission_id, created_at);

-- Function to log submission events
CREATE OR REPLACE FUNCTION public.log_submission_event(
  p_user_id uuid,
  p_submission_id uuid,
  p_event_type text,
  p_event_data jsonb DEFAULT '{}',
  p_processing_time_ms integer DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO public.submission_logs (
    user_id, submission_id, event_type, event_data, processing_time_ms
  ) VALUES (
    p_user_id, p_submission_id, p_event_type, p_event_data, p_processing_time_ms
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Analytics function for submission tracking
CREATE OR REPLACE FUNCTION public.get_submission_analytics(p_user_id uuid)
RETURNS TABLE(
  total_submissions bigint,
  successful_submissions bigint,
  failed_submissions bigint,
  duplicate_attempts bigint,
  avg_processing_time_ms numeric,
  last_submission_date timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT ts.id) as total_submissions,
    COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'completed') as successful_submissions,
    COUNT(DISTINCT ts.id) FILTER (WHERE ts.status = 'failed') as failed_submissions,
    COUNT(DISTINCT sl.id) FILTER (WHERE sl.event_type = 'duplicate_detected') as duplicate_attempts,
    AVG(sl.processing_time_ms) FILTER (WHERE sl.processing_time_ms IS NOT NULL) as avg_processing_time_ms,
    MAX(ts.created_at) as last_submission_date
  FROM public.theme_submissions ts
  LEFT JOIN public.submission_logs sl ON ts.id = sl.submission_id
  WHERE ts.user_id = p_user_id;
END;
$$;