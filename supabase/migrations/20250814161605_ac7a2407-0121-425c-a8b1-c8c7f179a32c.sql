-- First, let's fix existing data where prompts exist but status is not set correctly
UPDATE social_media_posts 
SET individual_prompt_status = 'completed'
WHERE generated_image_prompt IS NOT NULL 
  AND generated_image_prompt != '' 
  AND individual_prompt_status != 'completed';

-- Update theme completion statuses based on actual prompt data
-- This will trigger the theme completion status update function
UPDATE themes 
SET prompt_completion_count = (
  SELECT COUNT(*)
  FROM social_media_posts 
  WHERE social_media_posts.theme_id = themes.id 
    AND social_media_posts.generated_image_prompt IS NOT NULL
    AND social_media_posts.generated_image_prompt != ''
),
total_posts_count = (
  SELECT COUNT(*)
  FROM social_media_posts 
  WHERE social_media_posts.theme_id = themes.id
),
prompt_generation_status = CASE 
  WHEN (
    SELECT COUNT(*)
    FROM social_media_posts 
    WHERE social_media_posts.theme_id = themes.id 
      AND social_media_posts.generated_image_prompt IS NOT NULL
      AND social_media_posts.generated_image_prompt != ''
  ) = 0 THEN 'not_started'
  WHEN (
    SELECT COUNT(*)
    FROM social_media_posts 
    WHERE social_media_posts.theme_id = themes.id 
      AND social_media_posts.generated_image_prompt IS NOT NULL
      AND social_media_posts.generated_image_prompt != ''
  ) = (
    SELECT COUNT(*)
    FROM social_media_posts 
    WHERE social_media_posts.theme_id = themes.id
  ) THEN 'completed'
  ELSE 'in_progress'
END,
updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM social_media_posts 
  WHERE social_media_posts.theme_id = themes.id
);