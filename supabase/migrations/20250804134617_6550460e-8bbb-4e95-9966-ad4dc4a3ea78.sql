-- Clear all supported_categories for the specific agent
UPDATE public.openai_agents 
SET 
  supported_categories = '{}',
  system_prompts = '[]'::jsonb,
  updated_at = now()
WHERE id = '159f87b8-a4bb-461f-86c4-a344c42c06a2';