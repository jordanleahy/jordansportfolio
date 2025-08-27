-- Phase 1: Fix themes table schema consistency
-- Rename theme_description to description in themes table
ALTER TABLE public.themes RENAME COLUMN theme_description TO description;

-- Phase 2: Clean up social_media_posts schema  
-- Remove redundant category column since category should come from theme relationship
ALTER TABLE public.social_media_posts DROP COLUMN IF EXISTS category;