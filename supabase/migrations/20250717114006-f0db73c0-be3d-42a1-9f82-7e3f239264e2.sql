-- Add audio_to_video_url column to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN audio_to_video_url TEXT;