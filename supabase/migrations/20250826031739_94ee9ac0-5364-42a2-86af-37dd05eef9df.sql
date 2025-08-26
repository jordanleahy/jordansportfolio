-- Final System Prompt Migration - Handle Only Remaining Data
-- Migrate System Prompt Generator object and clean up old JSONB data

DO $$
DECLARE
    agent_record RECORD;
    extracted_prompt_text TEXT;
    migration_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting final system prompt migration...';
    
    -- Migrate System Prompt Generator (object format) only
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
        ELSE
            RAISE NOTICE 'System Prompt Generator object data already exists in new format';
        END IF;
    ELSE
        RAISE NOTICE 'No System Prompt Generator object data found to migrate';
    END IF;
    
    -- Clean up ALL old JSONB system_prompts data (both objects and non-empty arrays)
    UPDATE openai_agents 
    SET system_prompts = '[]'::jsonb
    WHERE system_prompts IS NOT NULL 
    AND system_prompts != '[]'::jsonb;
    
    RAISE NOTICE 'Cleaned up old JSONB system_prompts data for all agents';
    RAISE NOTICE 'Final migration completed successfully. Total prompts migrated: %', migration_count;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Migration failed with error: % %', SQLERRM, SQLSTATE;
    RAISE;
END $$;