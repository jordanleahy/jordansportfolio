-- Reset stuck posts and fix theme image generation
-- Update all posts stuck in 'generating' status back to 'pending'
UPDATE public.social_media_posts 
SET theme_image_generation_status = 'pending',
    updated_at = now()
WHERE theme_image_generation_status = 'generating';

-- Create an index to improve theme lookup performance
CREATE INDEX IF NOT EXISTS idx_themes_lookup 
ON public.themes (user_id, theme_name, category);

-- Create an index to improve social media posts theme queries
CREATE INDEX IF NOT EXISTS idx_social_media_posts_theme_lookup 
ON public.social_media_posts (theme_id, user_id, day);