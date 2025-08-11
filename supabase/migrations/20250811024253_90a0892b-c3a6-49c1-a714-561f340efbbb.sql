-- Add theme_id column to system_prompts table
ALTER TABLE public.system_prompts 
ADD COLUMN theme_id UUID;

-- Create foreign key constraint to themes table
ALTER TABLE public.system_prompts 
ADD CONSTRAINT fk_system_prompts_theme_id 
FOREIGN KEY (theme_id) REFERENCES public.themes(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_system_prompts_theme_id ON public.system_prompts(theme_id);

-- Create composite index for theme_id and category lookups
CREATE INDEX idx_system_prompts_theme_id_category ON public.system_prompts(theme_id, category);

-- Populate theme_id for existing records where there's an exact match
UPDATE public.system_prompts 
SET theme_id = themes.id
FROM public.themes 
WHERE system_prompts.theme = themes.theme_name 
  AND system_prompts.category = themes.category;