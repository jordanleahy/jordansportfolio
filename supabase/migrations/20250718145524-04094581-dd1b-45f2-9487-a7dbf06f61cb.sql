-- Add og_image_url column to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN og_image_url text;