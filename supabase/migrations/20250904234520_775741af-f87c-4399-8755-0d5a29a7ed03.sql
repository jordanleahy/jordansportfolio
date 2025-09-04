-- Rename the table to a simpler name
ALTER TABLE theme_system_prompts_to_create_image_prompt_via_visual_prompt_a 
RENAME TO theme_system_prompts;

-- Update any indexes that reference the old table name
-- (PostgreSQL automatically updates indexes when renaming tables, but we'll verify)

-- Update any foreign key constraint names if needed
-- (PostgreSQL automatically handles this during table rename)

-- Verify the table exists with new name
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'theme_system_prompts';