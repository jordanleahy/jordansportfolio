-- Update the theme record to reflect completion status
UPDATE themes 
SET 
  lifecycle_status = 'ready',
  prompt_generation_status = 'completed',
  background_processing_complete = true,
  total_posts_count = 12,
  prompt_completion_count = 12,
  updated_at = now()
WHERE id = '65864527-3397-4251-bf96-87d461379bfa';