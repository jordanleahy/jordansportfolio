-- Update Good to Great themes to start prompt generation
UPDATE themes 
SET prompt_generation_status = 'in_progress',
    updated_at = now()
WHERE theme_name LIKE '%Good to Great%' 
AND prompt_generation_status = 'not_started';

-- Update all Good to Great posts to pending status to trigger prompt generation
UPDATE social_media_posts 
SET individual_prompt_status = 'pending',
    updated_at = now()
WHERE theme_id IN (
    SELECT id FROM themes WHERE theme_name LIKE '%Good to Great%'
) 
AND individual_prompt_status IS NULL;