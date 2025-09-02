-- Fix search_path security issue for the update function
CREATE OR REPLACE FUNCTION public.update_street_vision_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;