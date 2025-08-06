-- Rename name column to theme_name in themes table
ALTER TABLE public.themes 
RENAME COLUMN name TO theme_name;

-- Drop existing unique constraint (this will also drop the associated index)
ALTER TABLE public.themes 
DROP CONSTRAINT IF EXISTS themes_user_name_category_unique;

-- Drop the constraint that uses the index if it exists
ALTER TABLE public.themes 
DROP CONSTRAINT IF EXISTS idx_unique_user_category_theme_name;

-- Recreate the unique constraint with the new column name
ALTER TABLE public.themes 
ADD CONSTRAINT themes_user_theme_name_category_unique 
UNIQUE (user_id, theme_name, category);