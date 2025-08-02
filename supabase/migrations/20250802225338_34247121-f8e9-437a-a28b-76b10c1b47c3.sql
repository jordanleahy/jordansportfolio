-- Clear cached prompts for 'ran' category to force regeneration with updated system prompt
DELETE FROM public.cached_prompts 
WHERE category = 'ran';