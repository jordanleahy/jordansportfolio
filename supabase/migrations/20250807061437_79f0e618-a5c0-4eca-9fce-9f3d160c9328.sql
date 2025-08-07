-- Clean up existing duplicates before adding constraints
-- First, let's see what duplicates we have and clean them up

-- For theme_submissions table - keep the most recent submission per user+category
WITH ranked_submissions AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY user_id, category ORDER BY created_at DESC) as rn
  FROM public.theme_submissions
)
DELETE FROM public.theme_submissions 
WHERE id IN (
  SELECT id FROM ranked_submissions WHERE rn > 1
);

-- For themes table - keep the most recent theme per user+category  
WITH ranked_themes AS (
  SELECT id,
         ROW_NUMBER() OVER (PARTITION BY user_id, category ORDER BY created_at DESC) as rn
  FROM public.themes
)
DELETE FROM public.themes 
WHERE id IN (
  SELECT id FROM ranked_themes WHERE rn > 1
);

-- Also clean up social_media_posts for duplicate themes (keep posts from the most recent theme)
WITH latest_themes AS (
  SELECT user_id, category, id as theme_id,
         ROW_NUMBER() OVER (PARTITION BY user_id, category ORDER BY created_at DESC) as rn
  FROM public.themes
),
posts_to_delete AS (
  SELECT smp.id
  FROM public.social_media_posts smp
  JOIN public.themes t ON smp.theme_id = t.id
  WHERE EXISTS (
    SELECT 1 FROM latest_themes lt 
    WHERE lt.user_id = t.user_id 
    AND lt.category = t.category 
    AND lt.rn = 1 
    AND lt.theme_id != t.id
  )
)
UPDATE public.social_media_posts 
SET status = 'deleted'
WHERE id IN (SELECT id FROM posts_to_delete);

-- Now add the unique constraints
ALTER TABLE public.theme_submissions ADD CONSTRAINT theme_submissions_user_category_unique 
  UNIQUE (user_id, category);

ALTER TABLE public.themes ADD CONSTRAINT themes_user_category_unique 
  UNIQUE (user_id, category);