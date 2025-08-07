-- Clean up duplicate system prompts to prevent multiple record errors
-- Keep only the most recent system prompt for each agent_id + category combination
WITH duplicates AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY agent_id, category 
      ORDER BY created_at DESC
    ) as rn
  FROM system_prompts
  WHERE is_active = true
),
deactivate_list AS (
  SELECT id FROM duplicates WHERE rn > 1
)
UPDATE system_prompts 
SET is_active = false, updated_at = now()
WHERE id IN (SELECT id FROM deactivate_list);

-- Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_system_prompts_unique_active 
ON system_prompts (agent_id, category) 
WHERE is_active = true;