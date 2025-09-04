-- Update foreign key constraint names to reflect the renamed table
ALTER TABLE public.theme_system_prompts_to_create_image_prompt_via_visual_prompt_a 
DROP CONSTRAINT IF EXISTS fk_system_prompts_theme_id;

ALTER TABLE public.theme_system_prompts_to_create_image_prompt_via_visual_prompt_a 
ADD CONSTRAINT fk_theme_system_prompts_theme_id 
FOREIGN KEY (theme_id) 
REFERENCES public.themes(id) 
ON DELETE CASCADE;

ALTER TABLE public.theme_system_prompts_to_create_image_prompt_via_visual_prompt_a 
DROP CONSTRAINT IF EXISTS system_prompts_agent_id_fkey;

ALTER TABLE public.theme_system_prompts_to_create_image_prompt_via_visual_prompt_a 
ADD CONSTRAINT theme_system_prompts_agent_id_fkey 
FOREIGN KEY (agent_id) 
REFERENCES public.openai_agents(id) 
ON DELETE CASCADE;