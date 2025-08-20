-- Update the validate_visual_sections function to remove character limits
CREATE OR REPLACE FUNCTION validate_visual_sections(sections jsonb)
RETURNS boolean
LANGUAGE plpgsql
AS $$
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
      char_length((sections->i->>'headline')::text) <= 40 AND
      char_length((sections->i->>'content')::text) >= 100 -- Minimum 100 characters
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;