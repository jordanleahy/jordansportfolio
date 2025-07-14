-- Drop existing RLS policies and create new ones allowing full CRUD for all authenticated users

-- Blog Posts Table
DROP POLICY IF EXISTS "Published blogs are viewable by everyone" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can view their own blogs" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can create their own blogs" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can update their own blogs" ON public.blog_posts;
DROP POLICY IF EXISTS "Users can delete their own blogs" ON public.blog_posts;

CREATE POLICY "Authenticated users can view all blog posts" ON public.blog_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create blog posts" ON public.blog_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update all blog posts" ON public.blog_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete all blog posts" ON public.blog_posts FOR DELETE TO authenticated USING (true);

-- Events Table
DROP POLICY IF EXISTS "Anyone can view public events" ON public.events;
DROP POLICY IF EXISTS "Users can view their own events" ON public.events;
DROP POLICY IF EXISTS "Users can create their own events" ON public.events;
DROP POLICY IF EXISTS "Users can update their own events" ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.events;
DROP POLICY IF EXISTS "Public events are viewable by everyone, private events by owner" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can create events." ON public.events;
DROP POLICY IF EXISTS "Users can update their own events." ON public.events;
DROP POLICY IF EXISTS "Users can delete their own events." ON public.events;

CREATE POLICY "Authenticated users can view all events" ON public.events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update all events" ON public.events FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete all events" ON public.events FOR DELETE TO authenticated USING (true);

-- Social Media Posts Table
DROP POLICY IF EXISTS "Users can view their own posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.social_media_posts;

CREATE POLICY "Authenticated users can view all social media posts" ON public.social_media_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can create social media posts" ON public.social_media_posts FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update all social media posts" ON public.social_media_posts FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete all social media posts" ON public.social_media_posts FOR DELETE TO authenticated USING (true);

-- SEC Tables - Add delete policies and update existing ones
-- FormD Submission Table
CREATE POLICY "Authenticated users can delete SEC formd_submission data" ON public.formd_submission FOR DELETE TO authenticated USING (true);

-- Issuers Table  
CREATE POLICY "Authenticated users can delete SEC issuers data" ON public.issuers FOR DELETE TO authenticated USING (true);

-- Offerings Table
CREATE POLICY "Authenticated users can delete SEC offerings data" ON public.offerings FOR DELETE TO authenticated USING (true);

-- Recipients Table
CREATE POLICY "Authenticated users can delete SEC recipients data" ON public.recipients FOR DELETE TO authenticated USING (true);

-- Related Persons Table  
CREATE POLICY "Authenticated users can delete SEC related_persons data" ON public.related_persons FOR DELETE TO authenticated USING (true);

-- Signatures Table
CREATE POLICY "Authenticated users can delete SEC signatures data" ON public.signatures FOR DELETE TO authenticated USING (true);