-- Fix import_theme_with_transaction function to use new insert_category_content signature
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
  post_record JSONB;
  v_error_message TEXT;
BEGIN
  -- Start transaction is implicit in function
  
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
    -- Insert posts using existing function with new signature
    SELECT public.insert_category_content(p_category, p_posts_data, p_theme_description, NULL::uuid) 
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