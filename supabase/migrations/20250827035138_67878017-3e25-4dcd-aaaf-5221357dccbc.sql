-- Drop the problematic function that uses the wrong column name
DROP FUNCTION IF EXISTS public.insert_category_content(jsonb, text, text, uuid);