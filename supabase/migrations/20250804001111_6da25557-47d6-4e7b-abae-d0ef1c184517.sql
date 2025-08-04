-- Update RLS policies for social_media_posts to allow proper function-based inserts

-- Drop the existing INSERT policy that's too restrictive
DROP POLICY IF EXISTS "Users can create their own social media posts" ON public.social_media_posts;

-- Create a new INSERT policy that allows both direct user inserts and function-based inserts
CREATE POLICY "Users can create their own social media posts" ON public.social_media_posts
FOR INSERT 
WITH CHECK (
  -- Allow direct inserts where user_id matches auth.uid()
  auth.uid() = user_id 
  OR 
  -- Allow inserts from SECURITY DEFINER functions when user is authenticated
  (auth.uid() IS NOT NULL AND current_setting('role', true) = 'postgres')
);

-- Also ensure the insert_category_content function properly handles user_id
-- Update the function to be more explicit about user_id handling
CREATE OR REPLACE FUNCTION public.insert_category_content(category_name text, posts_data jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
        current_user_id,  -- Explicitly use the stored user ID
        COALESCE(post_record->>'status', 'draft')::post_status
      );
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$function$;