-- Update System Prompt Generator to use GPT-5 mini
-- This updates all agents named 'System Prompt Generator' to the new model
UPDATE public.openai_agents
SET model_version = 'gpt-5-mini', updated_at = now()
WHERE name = 'System Prompt Generator';