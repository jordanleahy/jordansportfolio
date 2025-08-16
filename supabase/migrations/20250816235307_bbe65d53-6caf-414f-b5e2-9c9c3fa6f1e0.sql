-- Create automatic lifecycle status trigger function
CREATE OR REPLACE FUNCTION public.update_lifecycle_status_trigger()
RETURNS trigger AS $$
BEGIN
  -- Auto-update lifecycle_status based on prompt_generation_status
  IF NEW.prompt_generation_status = 'completed' AND 
     (OLD.prompt_generation_status IS NULL OR OLD.prompt_generation_status != 'completed') THEN
    NEW.lifecycle_status = 'ready';
    NEW.background_processing_complete = true;
    NEW.user_interaction_required = false;
  ELSIF NEW.prompt_generation_status = 'in_progress' AND 
        (OLD.prompt_generation_status IS NULL OR OLD.prompt_generation_status != 'in_progress') THEN
    NEW.lifecycle_status = 'generating';
    NEW.background_processing_complete = false;
    NEW.user_interaction_required = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;