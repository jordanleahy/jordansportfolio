-- Fix the insert_category_content function to properly cast status to post_status enum
CREATE OR REPLACE FUNCTION public.insert_category_content(
  category_name TEXT,
  posts_data JSONB
) RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  post_record JSONB;
  inserted_count INTEGER := 0;
BEGIN
  -- Only insert if user is authenticated
  IF auth.uid() IS NOT NULL THEN
    -- Loop through each post in the JSON array
    FOR post_record IN SELECT * FROM jsonb_array_elements(posts_data)
    LOOP
      INSERT INTO public.social_media_posts (
        day, 
        title, 
        description, 
        theme, 
        category, 
        user_id, 
        status
      ) VALUES (
        (post_record->>'day')::numeric,
        post_record->>'title',
        post_record->>'description',
        post_record->>'theme',
        category_name,
        auth.uid(),
        COALESCE(post_record->>'status', 'draft')::post_status
      );
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$$;