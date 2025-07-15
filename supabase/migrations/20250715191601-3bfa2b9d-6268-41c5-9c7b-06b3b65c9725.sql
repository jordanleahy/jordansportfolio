-- Add theme column to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN theme TEXT;