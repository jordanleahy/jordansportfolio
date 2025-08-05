-- Create themes table
CREATE TABLE public.themes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;

-- Create policies for themes
CREATE POLICY "Users can view their own themes" 
ON public.themes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own themes" 
ON public.themes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own themes" 
ON public.themes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own themes" 
ON public.themes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create unique constraint on user_id, category, name
ALTER TABLE public.themes 
ADD CONSTRAINT idx_unique_user_category_theme_name 
UNIQUE (user_id, category, name);

-- Create trigger for updated_at
CREATE TRIGGER update_themes_updated_at
BEFORE UPDATE ON public.themes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Extract unique themes from social_media_posts and insert into themes table
INSERT INTO public.themes (user_id, name, description, category)
SELECT DISTINCT 
  user_id,
  COALESCE(theme, 'Default Theme') as name,
  theme_description,
  COALESCE(category, 'general') as category
FROM public.social_media_posts
WHERE theme IS NOT NULL
ON CONFLICT (user_id, category, name) DO NOTHING;

-- Add theme_id column to social_media_posts
ALTER TABLE public.social_media_posts 
ADD COLUMN theme_id UUID REFERENCES public.themes(id);

-- Update social_media_posts to reference themes via theme_id
UPDATE public.social_media_posts 
SET theme_id = t.id
FROM public.themes t
WHERE social_media_posts.user_id = t.user_id
  AND COALESCE(social_media_posts.theme, 'Default Theme') = t.name
  AND COALESCE(social_media_posts.category, 'general') = t.category;

-- Drop the old unique constraint that was causing issues
DROP INDEX IF EXISTS idx_unique_user_category_theme;

-- Remove old theme-related columns (after data migration)
ALTER TABLE public.social_media_posts DROP COLUMN IF EXISTS theme;
ALTER TABLE public.social_media_posts DROP COLUMN IF EXISTS theme_description;