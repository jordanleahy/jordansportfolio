-- Remove all character length constraints from blog_posts table
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_hero_headline_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_hero_subhead_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_intro_content_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_tldr_title_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_deep_dive_title_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_deep_dive_content_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_cta_text_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_meta_title_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_meta_description_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_hero_badge_check;

-- Also remove validation constraints for visual sections and tldr bullets to be less strict
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_visual_sections_check;
ALTER TABLE public.blog_posts DROP CONSTRAINT IF EXISTS blog_posts_tldr_bullets_check;