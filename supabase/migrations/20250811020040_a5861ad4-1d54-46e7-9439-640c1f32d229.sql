-- Update the themes table with the most recent system prompt ID for the Playful Floating theme
UPDATE themes 
SET visual_prompt_system_prompt_id = '42687df3-8615-408e-8649-99b78c7a49b0',
    updated_at = now()
WHERE id = '67ca37f8-e4b6-4466-9e50-c603863c2515';