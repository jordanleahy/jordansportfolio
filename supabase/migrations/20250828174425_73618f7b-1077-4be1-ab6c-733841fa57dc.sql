-- Update publish_shared_collection_1_1 function to accept selected image URLs
CREATE OR REPLACE FUNCTION public.publish_shared_collection_1_1(
  p_handle text, 
  p_title text DEFAULT NULL::text, 
  p_description text DEFAULT NULL::text, 
  p_post_ids uuid[] DEFAULT NULL::uuid[], 
  p_theme_id uuid DEFAULT NULL::uuid,
  p_public_access_type text DEFAULT 'blurred'::text,
  p_selected_image_urls jsonb DEFAULT NULL::jsonb
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
    SELECT 
      id, 
      CASE 
        WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
        THEN (p_selected_image_urls ->> id::text)
        ELSE image_1_1_url 
      END as final_image_url,
      day,
      title,
      description,
      created_at
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND (
        CASE 
          WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
          THEN (p_selected_image_urls ->> id::text) IS NOT NULL
          ELSE image_1_1_url IS NOT NULL 
        END
      )
      AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
      AND (p_theme_id IS NULL OR theme_id = p_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  )
  SELECT COUNT(*) INTO v_count FROM candidates;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'At least 1 post with 1:1 image is required (found: 0).';
  END IF;

  -- Get cover image from day 1 post (or first post if no day 1) using selected images if available
  SELECT 
    CASE 
      WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
      THEN (p_selected_image_urls ->> id::text)
      ELSE image_1_1_url 
    END
  INTO v_cover_image_url
  FROM public.social_media_posts
  WHERE user_id = v_user_id
    AND (
      CASE 
        WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
        THEN (p_selected_image_urls ->> id::text) IS NOT NULL
        ELSE image_1_1_url IS NOT NULL 
      END
    )
    AND (p_post_ids IS NULL OR id = ANY(p_post_ids))
    AND (p_theme_id IS NULL OR theme_id = p_theme_id)
  ORDER BY 
    CASE WHEN day = 1 THEN 0 ELSE 1 END,
    COALESCE(day, 999999) ASC, 
    created_at ASC
  LIMIT 1;

  -- Insert with theme_id and public_access_type
  INSERT INTO public.shared_collections (user_id, handle, title, description, item_count, status, cover_image_url, theme_id, public_access_type)
  VALUES (v_user_id, v_handle, NULLIF(p_title, ''), NULLIF(p_description, ''), 0, 'draft', v_cover_image_url, p_theme_id, p_public_access_type)
  RETURNING id INTO v_collection_id;

  -- Insert collection items using selected images when available
  INSERT INTO public.shared_collection_items (collection_id, post_id, title, description, image_1_1_url, position)
  SELECT v_collection_id, id, title, description, final_image_url,
         row_number() OVER (ORDER BY COALESCE(day, 999999) ASC, created_at ASC)
  FROM (
    SELECT 
      id, 
      title, 
      description, 
      CASE 
        WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
        THEN (p_selected_image_urls ->> id::text)
        ELSE image_1_1_url 
      END as final_image_url,
      day, 
      created_at
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND (
        CASE 
          WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
          THEN (p_selected_image_urls ->> id::text) IS NOT NULL
          ELSE image_1_1_url IS NOT NULL 
        END
      )
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