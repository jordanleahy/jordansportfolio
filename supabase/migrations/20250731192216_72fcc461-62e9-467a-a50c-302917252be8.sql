-- Rename "Blog Visual Prompt Generator" to "Visual Prompt Generator"
UPDATE public.openai_agents 
SET name = 'Visual Prompt Generator'
WHERE name = 'Blog Visual Prompt Generator';

-- Update any cached prompts that reference the old agent name
UPDATE public.cached_prompts 
SET metadata = jsonb_set(
  metadata, 
  '{agent}', 
  '"Visual Prompt Generator"'
)
WHERE metadata->>'agent' = 'Blog Visual Prompt Generator';