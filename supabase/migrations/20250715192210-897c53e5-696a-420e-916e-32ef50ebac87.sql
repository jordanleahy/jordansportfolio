-- Update all existing social media posts to have 'CDI' theme
UPDATE public.social_media_posts 
SET theme = 'CDI' 
WHERE theme IS NULL;