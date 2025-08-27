-- Phase 2: Remove redundant category column from social_media_posts
-- Posts should get category through theme relationship via theme_id
ALTER TABLE public.social_media_posts DROP COLUMN IF EXISTS category;