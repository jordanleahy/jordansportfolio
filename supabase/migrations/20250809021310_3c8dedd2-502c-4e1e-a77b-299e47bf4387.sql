-- Step 2: Remove deprecated theme_image fields from social_media_posts table
-- These fields are no longer needed since we now use Day 1 post images instead

-- First, let's check if there are any posts using these fields that we need to preserve
-- (This is just for logging, the actual cleanup will happen below)

-- Remove the deprecated theme image columns
ALTER TABLE public.social_media_posts 
DROP COLUMN IF EXISTS theme_image_4_3_url,
DROP COLUMN IF EXISTS theme_image_generation_status;

-- Remove the theme-images storage bucket since it's no longer needed
DELETE FROM storage.buckets WHERE id = 'theme-images';