-- First, deactivate duplicate system_prompt_generation entries, keeping only the latest
WITH ranked_prompts AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY agent_id, category 
      ORDER BY created_at DESC
    ) as rn
  FROM system_prompts
  WHERE agent_id = '18939217-944d-4497-905a-81f5332ee08b'
    AND category = 'system_prompt_generation'
    AND is_active = true
)
UPDATE system_prompts 
SET is_active = false, updated_at = now()
WHERE id IN (
  SELECT id FROM ranked_prompts WHERE rn > 1
);

-- Delete any healthcare-specific category system prompts for this agent
DELETE FROM system_prompts 
WHERE agent_id = '18939217-944d-4497-905a-81f5332ee08b'
  AND category IN (
    'cdi', 
    'healthcare-coding', 
    'pharmaceuticals', 
    'hospital-operations',
    'contracts',
    'medical-devices',
    'telemedicine',
    'patient-care',
    'healthcare',
    'medical'
  );