-- Add foreign key relationship between blog posts and social media posts
ALTER TABLE public.blog_posts 
ADD COLUMN social_media_post_id uuid REFERENCES public.social_media_posts(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_blog_posts_social_media_post_id ON public.blog_posts(social_media_post_id);