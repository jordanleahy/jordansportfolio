
-- 1) Drop uniqueness across (user_id, theme_name, category)
ALTER TABLE public.themes
  DROP CONSTRAINT IF EXISTS themes_user_theme_name_category_unique;

-- 2) Drop the old unique index if it exists
DROP INDEX IF EXISTS idx_unique_user_category_theme_name;

-- 3) Preserve performance with a non-unique index (same column order)
CREATE INDEX IF NOT EXISTS idx_user_category_theme_name
  ON public.themes (user_id, category, theme_name);
