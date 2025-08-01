-- Add seed_value column to social_media_posts table for post-specific visual consistency
ALTER TABLE public.social_media_posts 
ADD COLUMN seed_value bigint;