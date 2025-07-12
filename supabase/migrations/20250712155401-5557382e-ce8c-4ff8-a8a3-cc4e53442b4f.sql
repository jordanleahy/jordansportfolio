-- Create blog_posts table with structured content schema
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Hero Section (strictly validated)
  hero_headline TEXT NOT NULL CHECK (char_length(hero_headline) <= 60), -- ~8 words max
  hero_subhead TEXT NOT NULL CHECK (char_length(hero_subhead) BETWEEN 80 AND 150), -- 15-25 words
  hero_image_url TEXT,
  hero_video_url TEXT,
  hero_badge TEXT CHECK (char_length(hero_badge) <= 20),
  
  -- Intro Section
  intro_content TEXT NOT NULL CHECK (char_length(intro_content) BETWEEN 250 AND 450), -- 50-75 words
  
  -- Visual Sections (exactly 3 required)
  visual_sections JSONB NOT NULL,
  
  -- TL;DR Section
  tldr_title TEXT NOT NULL DEFAULT 'TL;DR',
  tldr_bullets JSONB NOT NULL, -- Array of 3-5 bullet points
  
  -- Optional Deep Dive
  deep_dive_title TEXT,
  deep_dive_content TEXT CHECK (char_length(deep_dive_content) <= 1500), -- ~250 words max
  
  -- CTA & Share Section
  cta_text TEXT NOT NULL,
  cta_url TEXT,
  share_enabled BOOLEAN NOT NULL DEFAULT true,
  
  -- SEO Metadata
  meta_title TEXT NOT NULL CHECK (char_length(meta_title) <= 60),
  meta_description TEXT NOT NULL CHECK (char_length(meta_description) <= 155),
  meta_keywords TEXT[],
  
  -- Technical fields
  word_count INTEGER,
  read_time INTEGER, -- in minutes
  featured BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL,
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published blogs are viewable by everyone" 
ON public.blog_posts 
FOR SELECT 
USING (status = 'published');

CREATE POLICY "Users can view their own blogs" 
ON public.blog_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own blogs" 
ON public.blog_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blogs" 
ON public.blog_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blogs" 
ON public.blog_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('blog-images', 'blog-images', true);

-- Storage policies for blog images
CREATE POLICY "Blog images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

CREATE POLICY "Authenticated users can upload blog images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own blog images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own blog images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'blog-images' AND auth.uid() IS NOT NULL);

-- Validation function for visual sections
CREATE OR REPLACE FUNCTION public.validate_visual_sections(sections JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Must have exactly 3 sections
  IF jsonb_array_length(sections) != 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Each section must have required fields
  FOR i IN 0..2 LOOP
    IF NOT (
      sections->i ? 'headline' AND
      sections->i ? 'content' AND
      sections->i ? 'image_url' AND
      char_length(sections->i->>'headline') <= 40 AND -- ~6 words max
      char_length(sections->i->>'content') BETWEEN 300 AND 480 -- 60-80 words
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint for visual sections validation
ALTER TABLE public.blog_posts 
ADD CONSTRAINT valid_visual_sections 
CHECK (validate_visual_sections(visual_sections));

-- Validation function for TL;DR bullets
CREATE OR REPLACE FUNCTION public.validate_tldr_bullets(bullets JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Must have 3-5 bullets
  IF jsonb_array_length(bullets) < 3 OR jsonb_array_length(bullets) > 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Each bullet must be a string with reasonable length
  FOR i IN 0..(jsonb_array_length(bullets)-1) LOOP
    IF NOT (
      jsonb_typeof(bullets->i) = 'string' AND
      char_length(bullets->i::text) BETWEEN 10 AND 100
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Add constraint for TL;DR validation
ALTER TABLE public.blog_posts 
ADD CONSTRAINT valid_tldr_bullets 
CHECK (validate_tldr_bullets(tldr_bullets));

-- Auto-update timestamp trigger
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes for performance
CREATE INDEX idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts(status);
CREATE INDEX idx_blog_posts_category ON public.blog_posts(category);
CREATE INDEX idx_blog_posts_featured ON public.blog_posts(featured);
CREATE INDEX idx_blog_posts_published_at ON public.blog_posts(published_at DESC);