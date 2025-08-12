-- Add theme_id column to shared_collections if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shared_collections' AND column_name = 'theme_id') THEN
        ALTER TABLE public.shared_collections ADD COLUMN theme_id uuid;
    END IF;
END $$;

-- Update publish_shared_collection_1_1 function to store theme_id
CREATE OR REPLACE FUNCTION public.publish_shared_collection_1_1(p_handle text, p_title text DEFAULT NULL::text, p_description text DEFAULT NULL::text, p_post_ids uuid[] DEFAULT NULL::uuid[], p_category text DEFAULT NULL::text, p_theme_id uuid DEFAULT NULL::uuid)
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
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_handle := lower(regexp_replace(coalesce(p_handle, ''), '[^a-zA-Z0-9_-]+', '-', 'g'));
  IF v_handle IS NULL OR length(trim(v_handle)) = 0 THEN
    RAISE EXCEPTION 'Handle is required';
  END IF;

  WITH candidates AS (
    SELECT id, image_1_1_url, day
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND image_1_1_url IS NOT NULL
      AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
      AND (p_category IS NULL OR category = p_category)
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
    AND (p_category IS NULL OR category = p_category)
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
      AND (p_category IS NULL OR category = p_category)
      AND (p_theme_id IS NULL OR theme_id = p_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  ) s;

  UPDATE public.shared_collections 
  SET item_count = v_count, status = 'published', published_at = now()
  WHERE id = v_collection_id;

  RETURN v_collection_id;
END;
$function$;

-- Update update_shared_collection_1_1 function to preserve theme_id
CREATE OR REPLACE FUNCTION public.update_shared_collection_1_1(p_collection_id uuid, p_theme_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_count integer := 0;
  v_handle text;
  v_stored_theme_id uuid;
  v_final_theme_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get collection info and existing theme_id
  SELECT handle, theme_id INTO v_handle, v_stored_theme_id
  FROM public.shared_collections
  WHERE id = p_collection_id AND user_id = v_user_id;
  
  IF v_handle IS NULL THEN
    RAISE EXCEPTION 'Collection not found or access denied';
  END IF;

  -- Use provided theme_id or fall back to stored one
  v_final_theme_id := COALESCE(p_theme_id, v_stored_theme_id);

  -- Count posts with 1:1 images for this theme
  WITH candidates AS (
    SELECT id, image_1_1_url, day
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND image_1_1_url IS NOT NULL
      AND (v_final_theme_id IS NULL OR theme_id = v_final_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  )
  SELECT COUNT(*) INTO v_count FROM candidates;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'At least 1 post with 1:1 image is required (found: 0).';
  END IF;

  -- Delete existing collection items
  DELETE FROM public.shared_collection_items WHERE collection_id = p_collection_id;

  -- Insert new collection items with current posts
  INSERT INTO public.shared_collection_items (collection_id, post_id, title, description, image_1_1_url, position)
  SELECT p_collection_id, id, title, description, image_1_1_url,
         row_number() OVER (ORDER BY COALESCE(day, 999999) ASC, created_at ASC)
  FROM (
    SELECT id, title, description, image_1_1_url, day, created_at
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND image_1_1_url IS NOT NULL
      AND (v_final_theme_id IS NULL OR theme_id = v_final_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  ) s;

  -- Update collection metadata including theme_id
  UPDATE public.shared_collections 
  SET 
    item_count = v_count,
    theme_id = v_final_theme_id,
    updated_at = now(),
    published_at = now()
  WHERE id = p_collection_id;

  RETURN p_collection_id;
END;
$function$;