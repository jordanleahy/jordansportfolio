-- Fix the cleanup_duplicate_posts function to use theme_id instead of theme field
CREATE OR REPLACE FUNCTION public.cleanup_duplicate_posts(p_user_id uuid, p_category text, p_theme_id uuid, p_keep_latest boolean DEFAULT true)
 RETURNS TABLE(action text, post_count integer, kept_posts integer, removed_posts integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_total_posts integer := 0;
  v_removed_posts integer := 0;
BEGIN
  -- Count total posts for this category+theme_id
  SELECT COUNT(*)
  INTO v_total_posts
  FROM public.social_media_posts
  WHERE user_id = p_user_id
    AND category = p_category
    AND theme_id = p_theme_id
    AND status != 'deleted';
  
  -- If no duplicates, return early
  IF v_total_posts <= 1 THEN
    RETURN QUERY SELECT 'no_duplicates'::text, v_total_posts, v_total_posts, 0;
    RETURN;
  END IF;
  
  -- Mark duplicates as deleted, keeping one based on preference
  IF p_keep_latest THEN
    -- Keep the most recent, delete the rest
    WITH posts_to_delete AS (
      SELECT id 
      FROM public.social_media_posts
      WHERE user_id = p_user_id
        AND category = p_category
        AND theme_id = p_theme_id
        AND status != 'deleted'
      ORDER BY created_at DESC
      OFFSET 1
    )
    UPDATE public.social_media_posts 
    SET status = 'deleted', updated_at = now()
    WHERE id IN (SELECT id FROM posts_to_delete);
  ELSE
    -- Keep the oldest, delete the rest
    WITH posts_to_delete AS (
      SELECT id 
      FROM public.social_media_posts
      WHERE user_id = p_user_id
        AND category = p_category
        AND theme_id = p_theme_id
        AND status != 'deleted'
      ORDER BY created_at ASC
      OFFSET 1
    )
    UPDATE public.social_media_posts 
    SET status = 'deleted', updated_at = now()
    WHERE id IN (SELECT id FROM posts_to_delete);
  END IF;
  
  GET DIAGNOSTICS v_removed_posts = ROW_COUNT;
  
  RETURN QUERY SELECT 'cleanup_completed'::text, v_total_posts, 1, v_removed_posts;
END;
$function$;