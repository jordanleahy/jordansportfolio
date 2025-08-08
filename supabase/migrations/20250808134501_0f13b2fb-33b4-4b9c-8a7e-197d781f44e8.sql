-- Update Visual Prompt Generator to use GPT-5 mini
UPDATE public.openai_agents
SET model_version = 'gpt-5-mini', updated_at = now()
WHERE name = 'Visual Prompt Generator';