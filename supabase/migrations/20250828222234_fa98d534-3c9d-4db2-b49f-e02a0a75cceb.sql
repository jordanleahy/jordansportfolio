-- Update System Prompt Generator agent to use gpt-5-2025-08-07
UPDATE openai_agents 
SET model_version = 'gpt-5-2025-08-07', 
    updated_at = now()
WHERE id = '18939217-944d-4497-905a-81f5332ee08b' 
AND name = 'System Prompt Generator';