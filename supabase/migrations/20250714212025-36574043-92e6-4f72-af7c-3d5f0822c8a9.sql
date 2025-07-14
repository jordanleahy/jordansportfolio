-- Add generated_image_prompt column to cache prompts
ALTER TABLE public.social_media_posts 
ADD COLUMN generated_image_prompt TEXT DEFAULT NULL;