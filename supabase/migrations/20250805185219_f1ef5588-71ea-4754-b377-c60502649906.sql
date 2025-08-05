-- Force redeployment and cleanup - fix any remaining issues with the pipeline

-- First, let's check if there are any lingering references to a 'theme' column
-- This query will help us identify if there are any functions or triggers using the old column

-- Let's also ensure the insert_category_content function is properly updated
CREATE OR REPLACE FUNCTION public.insert_category_content(
  category_name text, 
  posts_data jsonb, 
  theme_description_param text DEFAULT NULL::text, 
  theme_id_param uuid DEFAULT NULL::uuid
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_record JSONB;
  inserted_count INTEGER := 0;
  current_user_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Only insert if user is authenticated
  IF current_user_id IS NOT NULL THEN
    -- Temporarily disable RLS for this session
    SET LOCAL row_security = off;
    
    -- Loop through each post in the JSON array
    FOR post_record IN SELECT * FROM jsonb_array_elements(posts_data)
    LOOP
      INSERT INTO public.social_media_posts (
        day, 
        title, 
        description, 
        theme_id,
        category, 
        user_id, 
        status,
        theme_image_generation_status
      ) VALUES (
        (post_record->>'day')::numeric,
        post_record->>'title',
        COALESCE(post_record->>'description', post_record->>'story_description'),
        theme_id_param,
        category_name,
        current_user_id,
        COALESCE(post_record->>'status', 'draft')::post_status,
        'pending'
      );
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$$;

-- Update the import_theme_with_transaction to properly handle the new schema
CREATE OR REPLACE FUNCTION public.import_theme_with_transaction(
  p_user_id uuid, 
  p_idempotency_key text, 
  p_category text, 
  p_theme text, 
  p_theme_description text, 
  p_posts_data jsonb
)
RETURNS TABLE(success boolean, inserted_count integer, submission_id uuid, error_message text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
  
  -- Check for duplicate theme
  IF EXISTS (
    SELECT 1 FROM public.find_duplicate_theme(p_user_id, p_category, p_theme)
  ) THEN
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
    -- First create or find the theme
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
$$;