-- Delete the two unwanted agent relationships
DELETE FROM agent_relationships 
WHERE id IN ('36cd266e-3902-4705-b367-8c694064b287', '65687681-4f97-4bcd-a385-88996ff80c02');

-- Update output target to reflect accurate usage
UPDATE openai_agents 
SET output_target = 'Category-specific system prompts (JSON) stored in system_prompts table. Used by Visual Prompt Generator for image generation workflows.',
    updated_at = NOW()
WHERE name = 'System Prompt Generator';