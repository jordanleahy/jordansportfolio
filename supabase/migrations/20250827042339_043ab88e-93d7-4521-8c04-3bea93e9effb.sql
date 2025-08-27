-- Drop all conflicting versions of insert_posts_for_theme function
DROP FUNCTION IF EXISTS public.insert_posts_for_theme CASCADE;

-- Create single definitive version of insert_posts_for_theme function
CREATE OR REPLACE FUNCTION public.insert_posts_for_theme(
  posts_data jsonb, 
  theme_description_param text DEFAULT NULL, 
  theme_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_id UUID;
  result jsonb;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Only proceed if user is authenticated
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Call insert_category_content with the correct parameter order
  SELECT insert_category_content(
    'default'::text,  -- category_name - using default since the function extracts category from theme data
    posts_data,
    theme_description_param,
    theme_id
  ) INTO result;
  
  RETURN result;
END;
$$;