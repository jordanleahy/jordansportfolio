-- Drop unique constraint enforcing (user_id, theme_name, category) uniqueness
ALTER TABLE public.themes
  DROP CONSTRAINT IF EXISTS themes_user_theme_name_category_unique;

-- Create a non-unique index to keep lookups fast without enforcing uniqueness
CREATE INDEX IF NOT EXISTS idx_themes_user_theme_name_category
  ON public.themes (user_id, theme_name, category);
