-- Add theme_id column to shared_collections table (without foreign key constraint)
ALTER TABLE public.shared_collections 
ADD COLUMN IF NOT EXISTS theme_id UUID;

-- Create index for better performance on theme_id queries
CREATE INDEX IF NOT EXISTS idx_shared_collections_theme_id ON public.shared_collections(theme_id);