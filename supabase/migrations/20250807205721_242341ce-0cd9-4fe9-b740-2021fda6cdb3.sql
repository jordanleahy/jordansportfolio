-- Fix linter: set search_path for update_images_updated_at function
CREATE OR REPLACE FUNCTION public.update_images_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;