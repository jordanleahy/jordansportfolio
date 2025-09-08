-- First, let's check if the trigger exists and fix the background processing pipeline

-- Create or replace the trigger function for theme lifecycle management
CREATE OR REPLACE FUNCTION public.trigger_theme_lifecycle_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log the trigger firing
  RAISE LOG 'Theme lifecycle trigger fired for theme ID: %', NEW.id;
  
  -- Call the edge function to start background processing
  PERFORM net.http_post(
    url := 'https://wgwmzfbnkovumqcvsxgd.supabase.co/functions/v1/manage-theme-lifecycle',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.jwt_secret', true)
    ),
    body := jsonb_build_object(
      'themeId', NEW.id,
      'action', 'start_processing',
      'userId', NEW.user_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS theme_lifecycle_trigger ON public.themes;

-- Create the trigger to fire after theme insert
CREATE TRIGGER theme_lifecycle_trigger
  AFTER INSERT ON public.themes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_theme_lifecycle_after_insert();

-- Also create a function to manually restart stuck themes
CREATE OR REPLACE FUNCTION public.restart_stuck_themes(p_user_id uuid DEFAULT NULL)
RETURNS TABLE(theme_id uuid, theme_name text, status text, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  theme_record RECORD;
  result_status text;
  result_message text;
BEGIN
  -- Find themes with posts that haven't started processing
  FOR theme_record IN
    SELECT DISTINCT t.id, t.theme_name, t.user_id
    FROM public.themes t
    JOIN public.social_media_posts p ON t.id = p.theme_id
    WHERE (p_user_id IS NULL OR t.user_id = p_user_id)
      AND p.individual_prompt_status = 'not_started'
      AND t.created_at > now() - interval '7 days' -- Only recent themes
  LOOP
    BEGIN
      -- Try to restart the theme processing
      PERFORM net.http_post(
        url := 'https://wgwmzfbnkovumqcvsxgd.supabase.co/functions/v1/manage-theme-lifecycle',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.jwt_secret', true)
        ),
        body := jsonb_build_object(
          'themeId', theme_record.id,
          'action', 'restart_processing',
          'userId', theme_record.user_id
        )
      );
      
      result_status := 'restarted';
      result_message := 'Processing restarted successfully';
      
    EXCEPTION WHEN OTHERS THEN
      result_status := 'failed';
      result_message := 'Failed to restart: ' || SQLERRM;
    END;
    
    RETURN QUERY SELECT theme_record.id, theme_record.theme_name, result_status, result_message;
  END LOOP;
END;
$$;

-- Create a monitoring function to check system health
CREATE OR REPLACE FUNCTION public.check_processing_health()
RETURNS TABLE(
  check_name text,
  status text,
  count integer,
  details text
)
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Check for stuck themes (posts not started after 10 minutes)
  RETURN QUERY
  SELECT 
    'stuck_themes'::text,
    CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'healthy' END::text,
    COUNT(*)::integer,
    'Themes with posts that haven''t started processing after 10+ minutes'::text
  FROM public.themes t
  JOIN public.social_media_posts p ON t.id = p.theme_id
  WHERE p.individual_prompt_status = 'not_started'
    AND t.created_at < now() - interval '10 minutes';

  -- Check for themes stuck in progress
  RETURN QUERY  
  SELECT 
    'stalled_themes'::text,
    CASE WHEN COUNT(*) > 0 THEN 'warning' ELSE 'healthy' END::text,
    COUNT(*)::integer,
    'Themes stuck in progress for over 1 hour'::text
  FROM public.themes t
  WHERE t.prompt_generation_status = 'in_progress'
    AND t.updated_at < now() - interval '1 hour';

  -- Check for missing system prompts
  RETURN QUERY
  SELECT 
    'missing_system_prompts'::text,
    CASE WHEN COUNT(*) > 0 THEN 'error' ELSE 'healthy' END::text,
    COUNT(*)::integer,
    'Themes without system prompts after 15+ minutes'::text
  FROM public.themes t
  LEFT JOIN public.theme_system_prompts tsp ON t.id = tsp.theme_id
  WHERE tsp.theme_id IS NULL
    AND t.created_at < now() - interval '15 minutes';
END;
$$;