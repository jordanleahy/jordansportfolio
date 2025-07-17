-- Remove audio_to_video_url column from social_media_posts table
ALTER TABLE public.social_media_posts 
DROP COLUMN audio_to_video_url;