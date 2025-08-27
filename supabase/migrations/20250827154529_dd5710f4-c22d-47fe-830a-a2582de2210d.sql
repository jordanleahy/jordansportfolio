-- Add category column back to social_media_posts with default from theme
-- This allows posts to have category for performance while maintaining theme relationship
ALTER TABLE public.social_media_posts ADD COLUMN category text;