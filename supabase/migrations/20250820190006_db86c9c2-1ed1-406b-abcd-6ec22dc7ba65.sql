-- Create atomic image generation status checker/updater function
CREATE OR REPLACE FUNCTION public.try_start_image_generation(
  p_post_id uuid,
  p_aspect_ratio text,
  p_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_status_field text;
  v_current_status text;
  v_updated_count integer;
  v_result jsonb;
BEGIN
  -- Map aspect ratio to status field name
  v_status_field := 'image_' || replace(p_aspect_ratio, ':', '_') || '_status';
  
  -- Build dynamic query to check and update status atomically
  EXECUTE format(
    'UPDATE social_media_posts 
     SET %I = ''generating'', updated_at = now()
     WHERE id = $1 
       AND user_id = $2 
       AND (%I IS NULL OR %I IN (''none'', ''failed'', ''error''))
    ',
    v_status_field, v_status_field, v_status_field
  ) USING p_post_id, p_user_id;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  IF v_updated_count > 0 THEN
    -- Successfully acquired lock for generation
    v_result := jsonb_build_object(
      'success', true,
      'message', 'Generation started',
      'status', 'generating'
    );
  ELSE
    -- Check current status to provide better error message
    EXECUTE format(
      'SELECT COALESCE(%I, ''none'') FROM social_media_posts WHERE id = $1 AND user_id = $2',
      v_status_field
    ) INTO v_current_status USING p_post_id, p_user_id;
    
    v_result := jsonb_build_object(
      'success', false,
      'message', 'Generation already in progress or completed',
      'current_status', COALESCE(v_current_status, 'none')
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Create function to update generation status (success/failure)
CREATE OR REPLACE FUNCTION public.complete_image_generation(
  p_post_id uuid,
  p_aspect_ratio text,
  p_user_id uuid,
  p_status text,
  p_image_url text DEFAULT NULL
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_status_field text;
  v_url_field text;
  v_updated_count integer;
BEGIN
  -- Map aspect ratio to field names
  v_status_field := 'image_' || replace(p_aspect_ratio, ':', '_') || '_status';
  v_url_field := 'image_' || replace(p_aspect_ratio, ':', '_') || '_url';
  
  -- Update the post with new status and optional URL
  IF p_image_url IS NOT NULL THEN
    EXECUTE format(
      'UPDATE social_media_posts 
       SET %I = $3, %I = $4, updated_at = now()
       WHERE id = $1 AND user_id = $2',
      v_status_field, v_url_field
    ) USING p_post_id, p_user_id, p_status, p_image_url;
  ELSE
    EXECUTE format(
      'UPDATE social_media_posts 
       SET %I = $3, updated_at = now()
       WHERE id = $1 AND user_id = $2',
      v_status_field
    ) USING p_post_id, p_user_id, p_status;
  END IF;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN v_updated_count > 0;
END;
$$;

-- Create cleanup function for stuck "generating" statuses
CREATE OR REPLACE FUNCTION public.cleanup_stuck_image_generations()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public' AS $$
DECLARE
  v_total_cleanup integer := 0;
  v_current_cleanup integer;
BEGIN
  -- Clean up image_16_9_status
  UPDATE social_media_posts 
  SET image_16_9_status = 'failed', updated_at = now()
  WHERE image_16_9_status = 'generating' 
    AND updated_at < now() - INTERVAL '10 minutes';
  GET DIAGNOSTICS v_current_cleanup = ROW_COUNT;
  v_total_cleanup := v_total_cleanup + v_current_cleanup;
  
  -- Clean up image_9_16_status
  UPDATE social_media_posts 
  SET image_9_16_status = 'failed', updated_at = now()
  WHERE image_9_16_status = 'generating' 
    AND updated_at < now() - INTERVAL '10 minutes';
  GET DIAGNOSTICS v_current_cleanup = ROW_COUNT;
  v_total_cleanup := v_total_cleanup + v_current_cleanup;
  
  -- Clean up image_4_3_status
  UPDATE social_media_posts 
  SET image_4_3_status = 'failed', updated_at = now()
  WHERE image_4_3_status = 'generating' 
    AND updated_at < now() - INTERVAL '10 minutes';
  GET DIAGNOSTICS v_current_cleanup = ROW_COUNT;
  v_total_cleanup := v_total_cleanup + v_current_cleanup;
  
  -- Clean up image_3_4_status
  UPDATE social_media_posts 
  SET image_3_4_status = 'failed', updated_at = now()
  WHERE image_3_4_status = 'generating' 
    AND updated_at < now() - INTERVAL '10 minutes';
  GET DIAGNOSTICS v_current_cleanup = ROW_COUNT;
  v_total_cleanup := v_total_cleanup + v_current_cleanup;
  
  -- Clean up image_1_1_status
  UPDATE social_media_posts 
  SET image_1_1_status = 'failed', updated_at = now()
  WHERE image_1_1_status = 'generating' 
    AND updated_at < now() - INTERVAL '10 minutes';
  GET DIAGNOSTICS v_current_cleanup = ROW_COUNT;
  v_total_cleanup := v_total_cleanup + v_current_cleanup;
  
  IF v_total_cleanup > 0 THEN
    RAISE NOTICE 'Cleaned up % stuck image generations', v_total_cleanup;
  END IF;
  
  RETURN v_total_cleanup;
END;
$$;