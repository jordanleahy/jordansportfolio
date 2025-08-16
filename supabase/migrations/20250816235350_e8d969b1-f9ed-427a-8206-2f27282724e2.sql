-- Create and activate the trigger for automatic lifecycle status updates
DROP TRIGGER IF EXISTS themes_lifecycle_update ON public.themes;

CREATE TRIGGER themes_lifecycle_update
  BEFORE UPDATE ON public.themes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_lifecycle_status_trigger();