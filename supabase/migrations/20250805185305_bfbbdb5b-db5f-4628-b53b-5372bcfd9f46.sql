-- Add unique constraint to themes table to prevent duplicates and enable ON CONFLICT
ALTER TABLE public.themes 
ADD CONSTRAINT themes_user_name_category_unique 
UNIQUE (user_id, name, category);