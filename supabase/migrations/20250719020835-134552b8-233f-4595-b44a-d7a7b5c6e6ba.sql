-- Add hero_image_16_9_url field to blog_posts table
ALTER TABLE public.blog_posts 
ADD COLUMN hero_image_16_9_url text;