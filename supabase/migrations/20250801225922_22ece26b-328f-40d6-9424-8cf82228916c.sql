-- Create color_themes table
CREATE TABLE public.color_themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_system BOOLEAN NOT NULL DEFAULT false,
  
  -- Core color properties
  primary_color TEXT NOT NULL DEFAULT '#2563eb',
  secondary_color TEXT NOT NULL DEFAULT '#0891b2', 
  accent_color TEXT NOT NULL DEFAULT '#16a34a',
  background_color TEXT NOT NULL DEFAULT '#ffffff',
  text_color TEXT NOT NULL DEFAULT '#1f2937',
  border_color TEXT NOT NULL DEFAULT '#e5e7eb',
  
  -- Additional theme properties
  color_instructions TEXT NOT NULL DEFAULT 'Use professional colors with good contrast',
  visual_style TEXT NOT NULL DEFAULT 'modern',
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.color_themes ENABLE ROW LEVEL SECURITY;

-- Create policies for color themes
CREATE POLICY "Users can view their own color themes" 
ON public.color_themes 
FOR SELECT 
USING (auth.uid() = user_id OR is_system = true);

CREATE POLICY "Users can create their own color themes" 
ON public.color_themes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own color themes" 
ON public.color_themes 
FOR UPDATE 
USING (auth.uid() = user_id AND is_system = false);

CREATE POLICY "Users can delete their own color themes" 
ON public.color_themes 
FOR DELETE 
USING (auth.uid() = user_id AND is_system = false);

-- Add color_theme_id to social_media_posts
ALTER TABLE public.social_media_posts 
ADD COLUMN color_theme_id UUID REFERENCES public.color_themes(id);

-- Add color_theme_id to blog_posts  
ALTER TABLE public.blog_posts
ADD COLUMN color_theme_id UUID REFERENCES public.color_themes(id);

-- Create unique constraint for user + slug
CREATE UNIQUE INDEX color_themes_user_slug_idx ON public.color_themes(user_id, slug);

-- Create trigger for updated_at
CREATE TRIGGER update_color_themes_updated_at
BEFORE UPDATE ON public.color_themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert system default color themes
INSERT INTO public.color_themes (
  user_id, name, slug, description, is_system, is_default,
  primary_color, secondary_color, accent_color, background_color, text_color, border_color,
  color_instructions, visual_style
) VALUES
-- Default theme
(
  '00000000-0000-0000-0000-000000000000',
  'Default', 
  'default',
  'Professional blue theme with modern colors',
  true,
  true,
  '#2563eb', '#0891b2', '#16a34a', '#ffffff', '#1f2937', '#e5e7eb',
  'Use professional blue tones with clean whites and grays. Maintain good contrast for readability.',
  'modern'
),
-- Black & White theme
(
  '00000000-0000-0000-0000-000000000000',
  'Black & White',
  'black-white', 
  'High contrast monochrome theme',
  true,
  false,
  '#000000', '#404040', '#666666', '#ffffff', '#000000', '#cccccc',
  'Use only black, white, and grayscale tones. Create high contrast, clean, professional visuals.',
  'minimalist'
),
-- Healthcare theme
(
  '00000000-0000-0000-0000-000000000000',
  'Healthcare',
  'healthcare',
  'Medical and health-focused color palette',
  true,
  false,
  '#0f766e', '#059669', '#22c55e', '#f0fdf4', '#064e3b', '#bbf7d0',
  'Use calming greens and blues associated with healthcare. Include medical imagery and professional healthcare environments.',
  'healthcare'
),
-- Corporate theme
(
  '00000000-0000-0000-0000-000000000000',
  'Corporate',
  'corporate',
  'Professional business color scheme',
  true,
  false,
  '#1e40af', '#1d4ed8', '#3b82f6', '#f8fafc', '#1e293b', '#cbd5e1',
  'Use corporate blues and professional grays. Focus on business environments and formal presentations.',
  'corporate'
);