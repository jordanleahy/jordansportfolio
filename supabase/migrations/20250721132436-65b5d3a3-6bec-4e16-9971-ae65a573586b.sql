
-- Update the validation function to remove the 10-100 character length requirement for TL;DR bullets
CREATE OR REPLACE FUNCTION public.validate_tldr_bullets(bullets jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Must have 3-5 bullets
  IF jsonb_array_length(bullets) < 3 OR jsonb_array_length(bullets) > 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Each bullet must be a string (removed character length requirement)
  FOR i IN 0..(jsonb_array_length(bullets)-1) LOOP
    IF NOT (jsonb_typeof(bullets->i) = 'string') THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$function$;
