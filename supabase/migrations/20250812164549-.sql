-- Fix parameter order - parameters with defaults must come after non-default parameters
CREATE OR REPLACE FUNCTION public.insert_category_content(
  posts_data jsonb,
  category_name text DEFAULT NULL,
  theme_description_param text DEFAULT NULL::text,
  theme_id_param uuid DEFAULT NULL::uuid
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
  resolved_category TEXT;
BEGIN
  -- Get the current authenticated user ID
  current_user_id := auth.uid();
  
  -- Only insert if user is authenticated
  IF current_user_id IS NOT NULL THEN
    -- Temporarily disable RLS for this session
    SET LOCAL row_security = off;
    
    -- Resolve category: prefer explicit param, otherwise derive from theme
    resolved_category := NULLIF(TRIM(category_name), '');

    IF resolved_category IS NULL THEN
      IF theme_id_param IS NOT NULL THEN
        SELECT category INTO resolved_category
        FROM public.themes
        WHERE id = theme_id_param;
      END IF;
    END IF;

    IF resolved_category IS NULL THEN
      RAISE EXCEPTION 'Category name is required: provide category_name or theme_id with an existing theme that has a category.';
    END IF;

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
        resolved_category,
        current_user_id,
        COALESCE(post_record->>'status', 'draft')::post_status,
        'pending'
      );
      
      inserted_count := inserted_count + 1;
    END LOOP;
  END IF;
  
  RETURN inserted_count;
END;
$function$;

-- Convenience wrapper that inserts posts for a theme without passing category
CREATE OR REPLACE FUNCTION public.insert_posts_for_theme(
  theme_id uuid,
  posts_data jsonb,
  theme_description_param text DEFAULT NULL::text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN public.insert_category_content(posts_data, NULL, theme_description_param, theme_id);
END;
$function$;