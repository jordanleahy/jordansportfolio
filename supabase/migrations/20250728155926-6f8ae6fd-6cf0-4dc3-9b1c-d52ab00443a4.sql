-- Remove chart-type from the specific agent
UPDATE openai_agents 
SET 
  supported_categories = array_remove(supported_categories, 'chart-type'),
  system_prompts = (
    SELECT jsonb_agg(sp)
    FROM jsonb_array_elements(system_prompts) AS sp
    WHERE sp->>'category' != 'chart-type'
  )
WHERE id = '159f87b8-a4bb-461f-86c4-a344c42c06a2';