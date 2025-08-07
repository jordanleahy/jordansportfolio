-- EMERGENCY FIX: Stop theme duplication by adding unique constraint and cleaning up duplicates

-- First, let's identify and remove duplicate themes (keeping the most recent ones)
WITH duplicate_themes AS (
  SELECT 
    theme_name, 
    category, 
    user_id,
    COUNT(*) as theme_count,
    MIN(id) as oldest_id,
    MAX(id) as newest_id
  FROM public.themes
  GROUP BY theme_name, category, user_id
  HAVING COUNT(*) > 1
),
themes_to_delete AS (
  SELECT t.id
  FROM public.themes t
  INNER JOIN duplicate_themes dt ON 
    t.theme_name = dt.theme_name 
    AND t.category = dt.category 
    AND t.user_id = dt.user_id
    AND t.id != dt.newest_id  -- Keep only the newest one
)
UPDATE public.social_media_posts 
SET theme_id = (
  SELECT dt.newest_id 
  FROM duplicate_themes dt 
  INNER JOIN public.themes t ON t.id = social_media_posts.theme_id
  WHERE t.theme_name = dt.theme_name 
    AND t.category = dt.category 
    AND t.user_id = dt.user_id
)
WHERE theme_id IN (SELECT id FROM themes_to_delete);

-- Now delete the duplicate themes
WITH duplicate_themes AS (
  SELECT 
    theme_name, 
    category, 
    user_id,
    COUNT(*) as theme_count,
    MIN(id) as oldest_id,
    MAX(id) as newest_id
  FROM public.themes
  GROUP BY theme_name, category, user_id
  HAVING COUNT(*) > 1
),
themes_to_delete AS (
  SELECT t.id
  FROM public.themes t
  INNER JOIN duplicate_themes dt ON 
    t.theme_name = dt.theme_name 
    AND t.category = dt.category 
    AND t.user_id = dt.user_id
    AND t.id != dt.newest_id  -- Keep only the newest one
)
DELETE FROM public.themes WHERE id IN (SELECT id FROM themes_to_delete);

-- Add unique constraint to prevent future duplicates
ALTER TABLE public.themes 
ADD CONSTRAINT themes_unique_per_user_category 
UNIQUE (user_id, theme_name, category);

-- Reset any posts stuck in generating status to pending
UPDATE public.social_media_posts 
SET theme_image_generation_status = 'pending', 
    updated_at = now()
WHERE theme_image_generation_status = 'generating';

-- Add comment for future reference
COMMENT ON CONSTRAINT themes_unique_per_user_category ON public.themes IS 'Prevents duplicate themes with same name and category for the same user';