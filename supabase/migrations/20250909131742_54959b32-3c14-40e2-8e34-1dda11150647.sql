-- Add share_title and share_description fields to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN share_title text,
ADD COLUMN share_description text;