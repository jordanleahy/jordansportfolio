-- Fix the system prompt linkage for "Bounce And Buoyancy Exploration" theme
UPDATE themes 
SET visual_prompt_system_prompt_id = '5215e16c-b172-4919-908f-4e045f00cd3e'
WHERE theme_name = 'Bounce And Buoyancy Exploration' 
  AND visual_prompt_system_prompt_id = '58fa518d-9715-40da-827d-6473ce8e5e52';