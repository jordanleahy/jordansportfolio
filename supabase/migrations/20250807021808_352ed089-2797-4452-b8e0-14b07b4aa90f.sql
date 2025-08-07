-- Add critical indexes for performance optimization (without CONCURRENTLY)
CREATE INDEX IF NOT EXISTS idx_social_media_posts_theme_id 
ON public.social_media_posts(theme_id) 
WHERE theme_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_social_media_posts_user_theme 
ON public.social_media_posts(user_id, theme_id) 
WHERE theme_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_themes_user_id 
ON public.themes(user_id);

-- Add composite index for faster theme queries with post counts
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status_theme 
ON public.social_media_posts(status, theme_id, user_id) 
WHERE status != 'deleted';