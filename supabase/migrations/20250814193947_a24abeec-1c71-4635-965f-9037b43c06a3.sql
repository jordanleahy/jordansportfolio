-- Create a trigger to invalidate theme cache when prompt generation status changes
CREATE OR REPLACE FUNCTION invalidate_theme_cache_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when theme status changes to help with debugging
  IF OLD.prompt_generation_status IS DISTINCT FROM NEW.prompt_generation_status THEN
    RAISE NOTICE 'Theme % status changed from % to %', NEW.id, OLD.prompt_generation_status, NEW.prompt_generation_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on themes table for status changes
DROP TRIGGER IF EXISTS trigger_invalidate_theme_cache ON themes;
CREATE TRIGGER trigger_invalidate_theme_cache
  AFTER UPDATE ON themes
  FOR EACH ROW
  WHEN (OLD.prompt_generation_status IS DISTINCT FROM NEW.prompt_generation_status)
  EXECUTE FUNCTION invalidate_theme_cache_on_status_change();