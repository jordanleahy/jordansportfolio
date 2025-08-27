-- Drop and recreate insert_posts_for_theme function with correct parameter order
DROP FUNCTION IF EXISTS public.insert_posts_for_theme(jsonb, text, uuid);

CREATE OR REPLACE FUNCTION public.insert_posts_for_theme(posts_data jsonb, theme_description_param text DEFAULT NULL, theme_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call insert_category_content with correct parameter order: category_name, posts_data, theme_description, theme_id
  RETURN public.insert_category_content('imported', posts_data, theme_description_param, theme_id);
END;
$$;