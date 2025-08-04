-- Add theme image storage to social_media_posts table
ALTER TABLE public.social_media_posts 
ADD COLUMN theme_image_4_3_url text,
ADD COLUMN theme_image_generation_status text DEFAULT 'pending';

-- Add index for better performance on category-based queries
CREATE INDEX idx_social_media_posts_category_theme ON public.social_media_posts(category, theme);

-- Enable realtime for theme image updates
ALTER TABLE public.social_media_posts REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.social_media_posts;