-- Rename name column to theme_name in themes table
ALTER TABLE public.themes 
RENAME COLUMN name TO theme_name;

-- Drop existing unique constraint that references the old column name
ALTER TABLE public.themes 
DROP CONSTRAINT IF EXISTS themes_user_name_category_unique;

-- Recreate the unique constraint with the new column name
ALTER TABLE public.themes 
ADD CONSTRAINT themes_user_theme_name_category_unique 
UNIQUE (user_id, theme_name, category);

-- Update any indexes that reference the old column name
DROP INDEX IF EXISTS idx_unique_user_category_theme_name;

-- Create new index with updated column name
CREATE UNIQUE INDEX idx_unique_user_category_theme_name 
ON public.themes (user_id, category, theme_name);