-- Test regeneration by deleting the existing Visual Prompt Generator for Clinical Knowledge Platform Overview
-- so the system will generate a new templated one
DELETE FROM public.system_prompts 
WHERE id = 'b1dc8006-4031-4c10-b5ee-cbfd4cb9d1b4';