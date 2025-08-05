-- Drop the old version of cleanup_duplicate_posts that takes p_theme as text
DROP FUNCTION IF EXISTS public.cleanup_duplicate_posts(uuid, text, text, boolean);

-- Drop and recreate find_duplicate_themes function with new signature
DROP FUNCTION IF EXISTS public.find_duplicate_themes(uuid);

-- Update find_duplicate_themes to work with themes table
CREATE OR REPLACE FUNCTION public.find_duplicate_themes(p_user_id uuid)
 RETURNS TABLE(category text, theme text, duplicate_count bigint, latest_theme_id uuid, earliest_created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.category,
    t.name as theme,
    COUNT(*) as duplicate_count,
    MAX(t.id) as latest_theme_id,
    MIN(t.created_at) as earliest_created_at
  FROM public.themes t
  WHERE t.user_id = p_user_id
  GROUP BY t.category, t.name
  HAVING COUNT(*) > 1
  ORDER BY COUNT(*) DESC, MIN(t.created_at) ASC;
END;
$function$;

-- Update import_theme_with_transaction to work correctly with theme_id relationships
CREATE OR REPLACE FUNCTION public.import_theme_with_transaction(p_user_id uuid, p_idempotency_key text, p_category text, p_theme text, p_theme_description text, p_posts_data jsonb)
 RETURNS TABLE(success boolean, inserted_count integer, submission_id uuid, error_message text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_submission_id UUID;
  v_inserted_count INTEGER := 0;
  v_theme_id UUID;
  v_error_message TEXT;
BEGIN
  -- Check rate limit
  IF NOT public.check_theme_submission_rate_limit(p_user_id) THEN
    RETURN QUERY SELECT false, 0, NULL::UUID, 'Rate limit exceeded. Please wait before submitting again.'::TEXT;
    RETURN;
  END IF;
  
  -- Check for existing submission with same idempotency key
  SELECT id INTO v_submission_id
  FROM public.theme_submissions
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
  
  IF v_submission_id IS NOT NULL THEN
    -- Return existing submission result
    RETURN QUERY 
    SELECT 
      (status = 'completed') as success,
      COALESCE(inserted_count, 0) as inserted_count,
      id as submission_id,
      error_message
    FROM public.theme_submissions
    WHERE id = v_submission_id;
    RETURN;
  END IF;
  
  -- Create new submission record
  INSERT INTO public.theme_submissions (
    user_id, idempotency_key, category, theme, theme_description, 
    submission_data, status
  ) VALUES (
    p_user_id, p_idempotency_key, p_category, p_theme, p_theme_description,
    p_posts_data, 'processing'
  ) RETURNING id INTO v_submission_id;
  
  -- Check for duplicate theme by name and category
  SELECT id INTO v_theme_id 
  FROM public.themes 
  WHERE user_id = p_user_id 
    AND name = p_theme 
    AND category = p_category;
  
  IF v_theme_id IS NOT NULL THEN
    -- Mark as failed due to duplicate
    UPDATE public.theme_submissions 
    SET 
      status = 'failed',
      error_message = 'Duplicate theme detected. A theme with this category and name already exists.',
      updated_at = now()
    WHERE id = v_submission_id;
    
    RETURN QUERY SELECT false, 0, v_submission_id, 'Duplicate theme detected. A theme with this category and name already exists.'::TEXT;
    RETURN;
  END IF;
  
  BEGIN
    -- First create the theme
    INSERT INTO public.themes (user_id, name, description, category)
    VALUES (p_user_id, p_theme, p_theme_description, p_category)
    ON CONFLICT (user_id, name, category) DO UPDATE SET
      description = EXCLUDED.description,
      updated_at = now()
    RETURNING id INTO v_theme_id;
    
    -- Insert posts using existing function with proper theme_id
    SELECT public.insert_category_content(p_category, p_posts_data, p_theme_description, v_theme_id) 
    INTO v_inserted_count;
    
    -- Mark submission as completed
    UPDATE public.theme_submissions 
    SET 
      status = 'completed',
      inserted_count = v_inserted_count,
      completed_at = now(),
      updated_at = now()
    WHERE id = v_submission_id;
    
    RETURN QUERY SELECT true, v_inserted_count, v_submission_id, NULL::TEXT;
    
  EXCEPTION WHEN OTHERS THEN
    -- Handle any errors during insertion
    v_error_message := SQLERRM;
    
    -- Mark submission as failed
    UPDATE public.theme_submissions 
    SET 
      status = 'failed',
      error_message = v_error_message,
      updated_at = now()
    WHERE id = v_submission_id;
    
    RETURN QUERY SELECT false, 0, v_submission_id, v_error_message;
  END;
END;
$function$;

-- Update find_duplicate_theme to work with themes table and theme_id
CREATE OR REPLACE FUNCTION public.find_duplicate_theme(p_user_id uuid, p_category text, p_theme text)
 RETURNS TABLE(existing_id uuid, existing_count integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    COALESCE(
      (SELECT COUNT(*)::integer 
       FROM public.social_media_posts smp 
       WHERE smp.user_id = p_user_id 
         AND smp.theme_id = t.id 
         AND smp.status != 'deleted'), 
      0
    ) as existing_count,
    t.created_at
  FROM public.themes t
  WHERE t.user_id = p_user_id
    AND t.category = p_category
    AND t.name = p_theme
  ORDER BY t.created_at DESC
  LIMIT 1;
END;
$function$;

-- Update enforce_theme_submission_time_window trigger to only work with theme_submissions table
CREATE OR REPLACE FUNCTION public.enforce_theme_submission_time_window()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  recent_submission_count INTEGER;
BEGIN
  -- Only check for recent theme submissions, not posts
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
$function$;