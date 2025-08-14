-- Add theme completion tracking fields
ALTER TABLE public.themes 
ADD COLUMN prompt_generation_status text DEFAULT 'not_started' CHECK (prompt_generation_status IN ('not_started', 'in_progress', 'completed')),
ADD COLUMN prompt_completion_count integer DEFAULT 0,
ADD COLUMN total_posts_count integer DEFAULT 0;

-- Add individual prompt status tracking to social_media_posts
ALTER TABLE public.social_media_posts 
ADD COLUMN individual_prompt_status text DEFAULT 'not_started' CHECK (individual_prompt_status IN ('not_started', 'in_progress', 'completed'));

-- Create function to update theme completion status
CREATE OR REPLACE FUNCTION update_theme_completion_status()
RETURNS TRIGGER AS $$
DECLARE
  theme_id_val uuid;
  completed_count integer;
  total_count integer;
BEGIN
  -- Get theme_id from the updated post
  theme_id_val := NEW.theme_id;
  
  IF theme_id_val IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Count completed posts for this theme
  SELECT COUNT(*) INTO completed_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val 
    AND individual_prompt_status = 'completed';
  
  -- Count total posts for this theme
  SELECT COUNT(*) INTO total_count
  FROM public.social_media_posts 
  WHERE theme_id = theme_id_val;
  
  -- Update theme completion status
  UPDATE public.themes 
  SET 
    prompt_completion_count = completed_count,
    total_posts_count = total_count,
    prompt_generation_status = CASE 
      WHEN completed_count = 0 THEN 'not_started'
      WHEN completed_count = total_count THEN 'completed'
      ELSE 'in_progress'
    END,
    updated_at = now()
  WHERE id = theme_id_val;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically update theme status when post status changes
CREATE TRIGGER trigger_update_theme_completion_status
  AFTER UPDATE OF individual_prompt_status ON public.social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_theme_completion_status();

-- Initialize existing themes with proper counts
UPDATE public.themes 
SET 
  total_posts_count = (
    SELECT COUNT(*) 
    FROM public.social_media_posts 
    WHERE theme_id = themes.id
  ),
  prompt_completion_count = (
    SELECT COUNT(*) 
    FROM public.social_media_posts 
    WHERE theme_id = themes.id 
      AND generated_image_prompt IS NOT NULL 
      AND generated_image_prompt != ''
  );

-- Update existing posts that have prompts to completed status
UPDATE public.social_media_posts 
SET individual_prompt_status = 'completed'
WHERE generated_image_prompt IS NOT NULL 
  AND generated_image_prompt != '';