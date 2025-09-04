-- Update foreign key constraint to reference the renamed table
ALTER TABLE public.system_prompt_versions 
DROP CONSTRAINT IF EXISTS system_prompt_versions_system_prompt_id_fkey;

ALTER TABLE public.system_prompt_versions 
ADD CONSTRAINT system_prompt_versions_system_prompt_id_fkey 
FOREIGN KEY (system_prompt_id) 
REFERENCES public.theme_system_prompts_to_create_image_prompt_via_visual_prompt_agent(id) 
ON DELETE CASCADE;