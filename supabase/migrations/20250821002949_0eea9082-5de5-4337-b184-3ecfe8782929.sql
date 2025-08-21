-- Fix search path for use case functions
CREATE OR REPLACE FUNCTION update_use_cases_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_use_case_created_by()
RETURNS TRIGGER
LANGUAGE plpgsql  
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.created_by = auth.uid();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;