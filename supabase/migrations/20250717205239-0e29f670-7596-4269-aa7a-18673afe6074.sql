-- Fix validation functions to properly handle JSONB data
CREATE OR REPLACE FUNCTION public.validate_visual_sections(sections jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Must have exactly 3 sections
  IF jsonb_array_length(sections) != 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Each section must have required fields
  FOR i IN 0..2 LOOP
    IF NOT (
      sections->i ? 'headline' AND
      sections->i ? 'content' AND
      sections->i ? 'image_url' AND
      char_length((sections->i->>'headline')::text) <= 40 AND -- ~6 words max
      char_length((sections->i->>'content')::text) BETWEEN 300 AND 480 -- 60-80 words
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_tldr_bullets(bullets jsonb)
 RETURNS boolean
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Must have 3-5 bullets
  IF jsonb_array_length(bullets) < 3 OR jsonb_array_length(bullets) > 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Each bullet must be a string with reasonable length
  FOR i IN 0..(jsonb_array_length(bullets)-1) LOOP
    IF NOT (
      jsonb_typeof(bullets->i) = 'string' AND
      char_length((bullets->i)::text) BETWEEN 10 AND 100
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$function$;