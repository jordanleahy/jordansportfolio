-- Remove the unique constraint that prevents multiple themes with same category per user
ALTER TABLE public.themes DROP CONSTRAINT IF EXISTS themes_user_category_unique;