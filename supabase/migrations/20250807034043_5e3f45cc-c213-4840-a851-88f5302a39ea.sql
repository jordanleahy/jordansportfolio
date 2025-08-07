-- Migration: Move Legacy System Prompts to New Table
-- This script migrates valuable system prompts from openai_agents.system_prompts JSON array 
-- to the new system_prompts table structure

DO $$
DECLARE
  agent_record RECORD;
  prompt_record JSONB;
  existing_prompt_count INTEGER;
  migrated_count INTEGER := 0;
  agent_count INTEGER := 0;
BEGIN
  -- Log start of migration
  RAISE NOTICE 'Starting migration of legacy system prompts to new table...';
  
  -- Loop through all agents that have system prompts in the JSON array
  FOR agent_record IN 
    SELECT 
      id, 
      name, 
      user_id,
      system_prompts,
      supported_categories
    FROM openai_agents 
    WHERE system_prompts IS NOT NULL 
      AND jsonb_array_length(system_prompts) > 0
  LOOP
    agent_count := agent_count + 1;
    RAISE NOTICE 'Processing agent: % (ID: %)', agent_record.name, agent_record.id;
    
    -- Loop through each prompt in the JSON array
    FOR prompt_record IN 
      SELECT * FROM jsonb_array_elements(agent_record.system_prompts)
    LOOP
      -- Check if this prompt already exists in the new table
      SELECT COUNT(*)
      INTO existing_prompt_count
      FROM system_prompts
      WHERE agent_id = agent_record.id
        AND category = (prompt_record->>'category')
        AND agent_name = agent_record.name;
      
      -- Only insert if it doesn't already exist
      IF existing_prompt_count = 0 THEN
        INSERT INTO system_prompts (
          agent_id,
          user_id,
          category,
          prompt_text,
          agent_name,
          agent_purpose,
          name,
          description,
          version,
          is_active,
          created_at,
          updated_at
        ) VALUES (
          agent_record.id,
          agent_record.user_id,
          prompt_record->>'category',
          prompt_record->>'prompt',
          agent_record.name,
          'Migrated from legacy system_prompts array',
          CONCAT(agent_record.name, ' - ', prompt_record->>'category'),
          CONCAT('Legacy prompt for ', prompt_record->>'category', ' category'),
          1,
          true,
          now(),
          now()
        );
        
        migrated_count := migrated_count + 1;
        RAISE NOTICE '  ✅ Migrated prompt for category: %', prompt_record->>'category';
      ELSE
        RAISE NOTICE '  ⏭️  Skipped existing prompt for category: %', prompt_record->>'category';
      END IF;
    END LOOP;
  END LOOP;
  
  -- Log completion summary
  RAISE NOTICE 'Migration completed!';
  RAISE NOTICE 'Processed % agents', agent_count;
  RAISE NOTICE 'Migrated % new prompts to system_prompts table', migrated_count;
  
  -- Show summary of what was migrated
  RAISE NOTICE 'Summary by agent:';
  FOR agent_record IN 
    SELECT 
      sp.agent_name,
      COUNT(*) as prompt_count,
      string_agg(sp.category, ', ' ORDER BY sp.category) as categories
    FROM system_prompts sp
    WHERE sp.created_at >= (now() - interval '1 minute')  -- Recently migrated
    GROUP BY sp.agent_name
    ORDER BY sp.agent_name
  LOOP
    RAISE NOTICE '  %: % prompts (%)', agent_record.agent_name, agent_record.prompt_count, agent_record.categories;
  END LOOP;
  
END $$;