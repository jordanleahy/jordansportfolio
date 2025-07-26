-- Remove restrictive category constraint to allow any category names
-- This allows users to import theme data with custom categories
ALTER TABLE public.social_media_posts 
DROP CONSTRAINT IF EXISTS check_valid_category;