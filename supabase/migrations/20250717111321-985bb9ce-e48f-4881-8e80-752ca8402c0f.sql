-- Add a general video URL column to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN general_video_url text;