-- Add RLS policy to allow anonymous users to view published blog posts
CREATE POLICY "Anonymous users can view published blog posts" 
ON public.blog_posts 
FOR SELECT 
TO anon 
USING (status = 'published');