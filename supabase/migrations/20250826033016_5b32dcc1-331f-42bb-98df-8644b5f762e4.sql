-- Final System Prompt Migration - Handle Array Format Data
-- Migrate Visual Prompt Generator and other agents with array-format system prompts

DO $$
DECLARE
    agent_record RECORD;
    prompt_element JSONB;
    extracted_prompt_text TEXT;
    extracted_category TEXT;
    migration_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting targeted system prompt migration for array format data...';
    
    -- Handle agents with array-format system_prompts (like Visual Prompt Generator)
    FOR agent_record IN
        SELECT id, user_id, name, purpose, owner, system_prompts AS old_prompts
        FROM openai_agents 
        WHERE system_prompts IS NOT NULL
        AND jsonb_typeof(system_prompts) = 'array'
        AND jsonb_array_length(system_prompts) > 0
    LOOP
        RAISE NOTICE 'Processing agent: %', agent_record.name;
        
        -- Loop through each prompt in the array
        FOR prompt_element IN
            SELECT jsonb_array_elements(agent_record.old_prompts)
        LOOP
            extracted_prompt_text := prompt_element->>'prompt';
            extracted_category := prompt_element->>'category';
            
            -- Skip if essential data is missing
            IF extracted_prompt_text IS NULL OR extracted_prompt_text = '' THEN
                CONTINUE;
            END IF;
            
            -- Check if this specific prompt doesn't already exist
            IF NOT EXISTS (
                SELECT 1 FROM system_prompts sp
                WHERE sp.agent_id = agent_record.id 
                AND sp.category = COALESCE(extracted_category, 'general')
                AND sp.prompt_text = extracted_prompt_text
            ) THEN
                INSERT INTO system_prompts (
                    agent_id,
                    user_id,
                    category,
                    prompt_text,
                    agent_name,
                    agent_purpose,
                    agent_owner,
                    name,
                    description,
                    generated_by
                ) VALUES (
                    agent_record.id,
                    agent_record.user_id,
                    COALESCE(extracted_category, 'general'),
                    extracted_prompt_text,
                    agent_record.name,
                    agent_record.purpose,
                    COALESCE(agent_record.owner, 'System Migration'),
                    CASE 
                        WHEN extracted_category IS NOT NULL THEN 
                            agent_record.name || ' - ' || extracted_category || ' System Prompt'
                        ELSE 
                            agent_record.name || ' System Prompt'
                    END,
                    CASE 
                        WHEN extracted_category IS NOT NULL THEN 
                            'Category-specific system prompt for ' || extracted_category || ' migrated from JSONB array'
                        ELSE 
                            'System prompt migrated from JSONB array format'
                    END,
                    'migration'
                );
                
                migration_count := migration_count + 1;
                RAISE NOTICE 'Migrated prompt for category: %', COALESCE(extracted_category, 'general');
            ELSE
                RAISE NOTICE 'Prompt for category % already exists, skipping', COALESCE(extracted_category, 'general');
            END IF;
        END LOOP;
    END LOOP;
    
    -- Also handle System Prompt Generator (object format) if it still exists
    SELECT id, user_id, name, purpose, owner, system_prompts AS old_prompts
    INTO agent_record
    FROM openai_agents 
    WHERE name = 'System Prompt Generator' 
    AND system_prompts IS NOT NULL
    AND jsonb_typeof(system_prompts) = 'object';
    
    IF agent_record.id IS NOT NULL THEN
        extracted_prompt_text := agent_record.old_prompts::text;
        
        IF NOT EXISTS (
            SELECT 1 FROM system_prompts sp
            WHERE sp.agent_id = agent_record.id 
            AND sp.prompt_text = extracted_prompt_text
        ) THEN
            INSERT INTO system_prompts (
                agent_id,
                user_id,
                prompt_text,
                agent_name,
                agent_purpose,
                agent_owner,
                name,
                description,
                generated_by
            ) VALUES (
                agent_record.id,
                agent_record.user_id,
                extracted_prompt_text,
                agent_record.name,
                agent_record.purpose,
                COALESCE(agent_record.owner, 'System Migration'),
                'Migrated System Prompt Generator Configuration',
                'Complex system prompt configuration migrated from JSONB object format',
                'migration'
            );
            
            migration_count := migration_count + 1;
            RAISE NOTICE 'Migrated System Prompt Generator object data';
        END IF;
    END IF;
    
    -- Clean up ALL old JSONB system_prompts data
    UPDATE openai_agents 
    SET system_prompts = '[]'::jsonb
    WHERE system_prompts IS NOT NULL 
    AND system_prompts != '[]'::jsonb;
    
    RAISE NOTICE 'Cleaned up old JSONB system_prompts data for all agents';
    RAISE NOTICE 'Migration completed successfully. Total prompts migrated: %', migration_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed with error: % %', SQLERRM, SQLSTATE;
    RAISE;
END $$;