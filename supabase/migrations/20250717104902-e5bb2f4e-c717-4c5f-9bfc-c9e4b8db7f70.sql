-- Update social_media_posts table to support videos
-- Add video URL columns
ALTER TABLE public.social_media_posts 
ADD COLUMN image_16_9_video_url text,
ADD COLUMN image_3_4_video_url text;

-- Update existing data to move 9:16 and 4:3 image URLs to video columns where appropriate
-- (This is a safe operation since we're adding new columns)