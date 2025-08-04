-- Add theme_description field to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN theme_description TEXT;