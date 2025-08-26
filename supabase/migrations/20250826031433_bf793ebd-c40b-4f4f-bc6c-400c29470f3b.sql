-- Complete System Prompt Migration (Fixed Column References)
-- Move remaining system prompts from openai_agents.system_prompts JSONB to system_prompts table

DO $$
DECLARE
    agent_record RECORD;
    prompt_element JSONB;
    extracted_prompt_text TEXT;
    migration_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting comprehensive system prompt migration...';
    
    -- 1. Migrate System Prompt Generator (object format)
    SELECT id, user_id, name, purpose, owner, system_prompts AS old_prompts
    INTO agent_record
    FROM openai_agents 
    WHERE name = 'System Prompt Generator' 
    AND system_prompts IS NOT NULL
    AND jsonb_typeof(system_prompts) = 'object';
    
    IF agent_record.id IS NOT NULL THEN
        -- Extract the complex prompt structure and convert to text
        extracted_prompt_text := agent_record.old_prompts::text;
        
        -- Check if this specific prompt doesn't already exist
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
                category
            ) VALUES (
                agent_record.id,
                agent_record.user_id,
                extracted_prompt_text,
                agent_record.name,
                agent_record.purpose,
                COALESCE(agent_record.owner, 'System Migration'),
                'Migrated System Prompt Generator Prompt',
                'Comprehensive system prompt migrated from JSONB format',
                'system_prompt_generation'
            );
            
            migration_count := migration_count + 1;
            RAISE NOTICE 'Migrated System Prompt Generator object data';
        ELSE
            RAISE NOTICE 'System Prompt Generator object data already exists in new format';
        END IF;
    END IF;
    
    -- 2. Migrate any remaining array-format prompts
    FOR agent_record IN 
        SELECT id, user_id, name, purpose, owner, system_prompts AS old_prompts
        FROM openai_agents 
        WHERE system_prompts IS NOT NULL
        AND jsonb_typeof(system_prompts) = 'array'
        AND jsonb_array_length(system_prompts) > 0
    LOOP
        -- Process each element in the array
        FOR prompt_element IN SELECT jsonb_array_elements(agent_record.old_prompts)
        LOOP
            -- Extract prompt text based on different possible structures
            extracted_prompt_text := COALESCE(
                prompt_element->>'content',
                prompt_element->>'prompt',
                prompt_element->>'text',
                prompt_element::text
            );
            
            -- Only migrate if we have actual content and it doesn't already exist
            IF extracted_prompt_text IS NOT NULL 
            AND LENGTH(trim(extracted_prompt_text)) > 10 
            AND NOT EXISTS (
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
                    category
                ) VALUES (
                    agent_record.id,
                    agent_record.user_id,
                    extracted_prompt_text,
                    agent_record.name,
                    agent_record.purpose,
                    COALESCE(agent_record.owner, 'System Migration'),
                    'Migrated ' || agent_record.name || ' Prompt',
                    'System prompt migrated from JSONB array format',
                    COALESCE(
                        CASE agent_record.name 
                            WHEN 'Triage Orchestra Agent' THEN 'input_triage'
                            WHEN 'Visual Prompt Generator' THEN 'visual_prompt_generation'
                            ELSE 'general'
                        END,
                        'general'
                    )
                );
                
                migration_count := migration_count + 1;
                RAISE NOTICE 'Migrated prompt for agent: %', agent_record.name;
            END IF;
        END LOOP;
    END LOOP;
    
    -- 3. Clean up the old JSONB system_prompts data
    UPDATE openai_agents 
    SET system_prompts = '[]'::jsonb
    WHERE system_prompts IS NOT NULL 
    AND (
        (jsonb_typeof(system_prompts) = 'array' AND jsonb_array_length(system_prompts) > 0) OR
        (jsonb_typeof(system_prompts) = 'object')
    );
    
    RAISE NOTICE 'Cleaned up old JSONB system_prompts data for agents';
    RAISE NOTICE 'Migration completed successfully. Total prompts migrated: %', migration_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed with error: % %', SQLERRM, SQLSTATE;
    RAISE;
END $$;