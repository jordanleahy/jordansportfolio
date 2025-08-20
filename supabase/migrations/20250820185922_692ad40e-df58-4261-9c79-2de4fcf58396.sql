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
  v_update_data jsonb;
BEGIN
  -- Map aspect ratio to field names
  v_status_field := 'image_' || replace(p_aspect_ratio, ':', '_') || '_status';
  v_url_field := 'image_' || replace(p_aspect_ratio, ':', '_') || '_url';
  
  -- Build update data
  v_update_data := jsonb_build_object(v_status_field, p_status, 'updated_at', now());
  
  -- Add image URL if provided
  IF p_image_url IS NOT NULL THEN
    v_update_data := v_update_data || jsonb_build_object(v_url_field, p_image_url);
  END IF;
  
  -- Update the post with new status and optional URL  
  EXECUTE format(
    'UPDATE social_media_posts 
     SET %s
     WHERE id = $1 AND user_id = $2',
    (
      SELECT string_agg(
        format('%I = ($3->>%L)::%s', 
          key, 
          key,
          CASE 
            WHEN key LIKE '%_status' THEN 'text'
            WHEN key LIKE '%_url' THEN 'text' 
            WHEN key = 'updated_at' THEN 'timestamp with time zone'
            ELSE 'text'
          END
        ), 
        ', '
      )
      FROM jsonb_object_keys(v_update_data) AS key
    )
  ) USING p_post_id, p_user_id, v_update_data;
  
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
  v_cleanup_count integer := 0;
  v_aspect_ratios text[] := ARRAY['16_9', '9_16', '4_3', '3_4', '1_1'];
  v_aspect text;
  v_field_name text;
BEGIN
  -- Clean up any "generating" status older than 10 minutes
  FOREACH v_aspect IN ARRAY v_aspect_ratios LOOP
    v_field_name := 'image_' || v_aspect || '_status';
    
    EXECUTE format(
      'UPDATE social_media_posts 
       SET %I = ''failed'', updated_at = now()
       WHERE %I = ''generating'' 
         AND updated_at < now() - INTERVAL ''10 minutes''',
      v_field_name, v_field_name
    );
    
    GET DIAGNOSTICS v_cleanup_count = v_cleanup_count + ROW_COUNT;
  END LOOP;
  
  IF v_cleanup_count > 0 THEN
    RAISE NOTICE 'Cleaned up % stuck image generations', v_cleanup_count;
  END IF;
  
  RETURN v_cleanup_count;
END;
$$;