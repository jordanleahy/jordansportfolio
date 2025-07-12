-- Performance indexes for blog_posts table
-- These indexes will dramatically improve query performance

-- Index for published blog posts (most common query)
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published 
ON public.blog_posts(status, published_at DESC)
WHERE status = 'published';

-- Index for user's blog posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_user_status 
ON public.blog_posts(user_id, status, updated_at DESC);

-- Index for blog post lookup by slug (unique lookups)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug 
ON public.blog_posts(slug)
WHERE status != 'archived';

-- Index for category filtering
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_published 
ON public.blog_posts(category, status, published_at DESC)
WHERE status = 'published';

-- Index for featured posts
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured 
ON public.blog_posts(featured, status, published_at DESC)
WHERE featured = true AND status = 'published';

-- Index for full-text search on titles and content
CREATE INDEX IF NOT EXISTS idx_blog_posts_search 
ON public.blog_posts USING gin(to_tsvector('english', hero_headline || ' ' || hero_subhead || ' ' || intro_content));

-- Index for events table (if being used)
CREATE INDEX IF NOT EXISTS idx_events_public_date 
ON public.events(is_public, event_date DESC)
WHERE is_public = true;

CREATE INDEX IF NOT EXISTS idx_events_user_status 
ON public.events(user_id, status, event_date DESC);