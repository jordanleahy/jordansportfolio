-- Remove obsolete seed management columns and tables
-- Remove selected_seed_id column from social_media_posts table
ALTER TABLE public.social_media_posts 
DROP COLUMN IF EXISTS selected_seed_id;

-- Drop image_seeds table as it's no longer needed
DROP TABLE IF EXISTS public.image_seeds;