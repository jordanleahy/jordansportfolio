-- Update the update_shared_collection_1_1 function to accept selected image URLs
CREATE OR REPLACE FUNCTION public.update_shared_collection_1_1(
  p_collection_id uuid, 
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

  -- Count posts with 1:1 images for this theme using selected images if available
  WITH candidates AS (
    SELECT 
      id, 
      CASE 
        WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
        THEN (p_selected_image_urls ->> id::text)
        ELSE image_1_1_url 
      END as final_image_url,
      day
    FROM public.social_media_posts
    WHERE user_id = v_user_id
      AND (
        CASE 
          WHEN p_selected_image_urls IS NOT NULL AND p_selected_image_urls ? id::text 
          THEN (p_selected_image_urls ->> id::text) IS NOT NULL
          ELSE image_1_1_url IS NOT NULL 
        END
      )
      AND (v_final_theme_id IS NULL OR theme_id = v_final_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  )
  SELECT COUNT(*) INTO v_count FROM candidates;

  IF v_count = 0 THEN
    RAISE EXCEPTION 'At least 1 post with 1:1 image is required (found: 0).';
  END IF;

  -- Delete existing collection items
  DELETE FROM public.shared_collection_items WHERE collection_id = p_collection_id;

  -- Insert new collection items with current posts using selected images when available
  INSERT INTO public.shared_collection_items (collection_id, post_id, title, description, image_1_1_url, position)
  SELECT p_collection_id, id, title, description, final_image_url,
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
      AND (v_final_theme_id IS NULL OR theme_id = v_final_theme_id)
    ORDER BY COALESCE(day, 999999) ASC, created_at ASC
  ) s;

  -- Update collection metadata including theme_id and public_access_type
  UPDATE public.shared_collections 
  SET 
    item_count = v_count,
    theme_id = v_final_theme_id,
    public_access_type = p_public_access_type,
    updated_at = now(),
    published_at = now()
  WHERE id = p_collection_id;

  RETURN p_collection_id;
END;
$function$;