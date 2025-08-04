-- Update the insert_category_content function to handle theme_description
DROP FUNCTION IF EXISTS public.insert_category_content(category_name text, posts_data jsonb);

CREATE OR REPLACE FUNCTION public.insert_category_content(
  category_name text, 
  posts_data jsonb,
  theme_description_param text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
        theme, 
        theme_description,
        category, 
        user_id, 
        status
      ) VALUES (
        (post_record->>'day')::numeric,
        post_record->>'title',
        post_record->>'story_description',  -- Map story_description to description column
        post_record->>'theme',
        theme_description_param,  -- Use the provided theme_description parameter
        category_name,
        current_user_id,
        COALESCE(post_record->>'status', 'draft')::post_status
      );
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$function$;