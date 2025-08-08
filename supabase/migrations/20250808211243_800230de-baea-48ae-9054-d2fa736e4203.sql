-- Remove legacy image analytics dependencies and the images table

-- 1) Drop admin_image_insights if it exists (handle both view or table cases)
DROP VIEW IF EXISTS public.admin_image_insights;
DROP TABLE IF EXISTS public.admin_image_insights;

-- 2) Drop images table (and any dependent objects)
DROP TABLE IF EXISTS public.images CASCADE;