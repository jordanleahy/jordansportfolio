-- Update the function to remove p_category parameter since category is now in themes table
CREATE OR REPLACE FUNCTION public.publish_shared_collection_1_1(
  p_handle text, 
  p_title text DEFAULT NULL::text, 
  p_description text DEFAULT NULL::text, 
  p_post_ids uuid[] DEFAULT NULL::uuid[], 
  p_theme_id uuid DEFAULT NULL::uuid
)
RETURNS uuid
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_handle text;
  v_collection_id uuid;
  v_count integer := 0;
  v_cover_image_url text;
  v_category text;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_handle := lower(regexp_replace(coalesce(p_handle, ''), '[^a-zA-Z0-9_-]+', '-', 'g'));
  IF v_handle IS NULL OR length(trim(v_handle)) = 0 THEN
    RAISE EXCEPTION 'Handle is required';
  END IF;

  -- Get category from theme if theme_id is provided
  IF p_theme_id IS NOT NULL THEN
    SELECT category INTO v_category
    FROM public.themes
    WHERE id = p_theme_id AND user_id = v_user_id;
  END IF;

  WITH candidates AS (
    SELECT id, image_1_1_url, day
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND image_1_1_url IS NOT NULL
      AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
      AND (p_theme_id IS NULL OR theme_id = p_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  )
  SELECT COUNT(*) INTO v_count FROM candidates;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'At least 1 post with 1:1 image is required (found: 0).';
  END IF;

  -- Get cover image from day 1 post (or first post if no day 1)
  SELECT image_1_1_url INTO v_cover_image_url
  FROM public.social_media_posts
  WHERE user_id = v_user_id
    AND image_1_1_url IS NOT NULL
    AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
    AND (p_theme_id IS NULL OR theme_id = p_theme_id)
  ORDER BY 
    CASE WHEN day = 1 THEN 0 ELSE 1 END,
    COALESCE(day, 999999) ASC, 
    created_at ASC
  LIMIT 1;

  -- Insert with theme_id
  INSERT INTO public.shared_collections (user_id, handle, title, description, item_count, status, cover_image_url, theme_id)
  VALUES (v_user_id, v_handle, NULLIF(p_title, ''), NULLIF(p_description, ''), 0, 'draft', v_cover_image_url, p_theme_id)
  RETURNING id INTO v_collection_id;

  INSERT INTO public.shared_collection_items (collection_id, post_id, title, description, image_1_1_url, position)
  SELECT v_collection_id, id, title, description, image_1_1_url,
         row_number() OVER (ORDER BY COALESCE(day, 999999) ASC, created_at ASC)
  FROM (
    SELECT id, title, description, image_1_1_url, day, created_at
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND image_1_1_url IS NOT NULL
      AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
      AND (p_theme_id IS NULL OR theme_id = p_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  ) s;

  UPDATE public.shared_collections 
  SET item_count = v_count, status = 'published', published_at = now()
  WHERE id = v_collection_id;

  RETURN v_collection_id;
END;
$function$;