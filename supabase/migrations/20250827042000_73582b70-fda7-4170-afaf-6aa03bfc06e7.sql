-- Fix insert_category_content function to use correct column name 'day' instead of 'day_number'
CREATE OR REPLACE FUNCTION public.insert_category_content(category_name text, posts_data jsonb, theme_description_param text DEFAULT NULL, theme_id_param uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  post_record JSONB;
  inserted_count INTEGER := 0;
  current_user_id UUID;
  result_theme_id UUID;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Only insert if user is authenticated
  IF current_user_id IS NOT NULL THEN
    -- Use provided theme_id or generate new one
    result_theme_id := theme_id_param;
    
    -- Temporarily disable RLS for this session
    SET LOCAL row_security = off;
    
    -- Loop through each post in the JSON array
    FOR post_record IN SELECT * FROM jsonb_array_elements(posts_data)
    LOOP
      INSERT INTO public.social_media_posts (
        day, 
        title, 
        story_description, 
        theme_id,
        category, 
        user_id, 
        status
      ) VALUES (
        (post_record->>'day')::numeric,
        post_record->>'title',
        COALESCE(post_record->>'description', post_record->>'story_description'),
        result_theme_id,
        category_name,
        current_user_id,
        COALESCE(post_record->>'status', 'draft')::post_status
      );
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  -- Return both inserted_count and theme_id
  RETURN jsonb_build_object(
    'inserted_count', inserted_count,
    'theme_id', result_theme_id
  );
END;
$$;