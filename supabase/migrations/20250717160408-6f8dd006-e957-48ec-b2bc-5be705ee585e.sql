-- Add GIF URL fields to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN image_16_9_gif_url text,
ADD COLUMN image_3_4_gif_url text,
ADD COLUMN general_gif_url text;