-- Migration: Fix Triage Orchestra Agent system prompt
-- Move the Triage Orchestra Agent's system prompt from JSONB column to system_prompts table

DO $$
DECLARE
    agent_record RECORD;
    prompt_text TEXT;
BEGIN
    -- Find the Triage Orchestra Agent and extract its system prompt
    SELECT id, user_id, purpose, system_prompts_data
    INTO agent_record
    FROM openai_agents 
    WHERE name = 'Triage Orchestra Agent'
    LIMIT 1;
    
    IF agent_record.id IS NOT NULL THEN
        -- Extract the prompt text from the JSONB array
        SELECT jsonb_array_elements_text(agent_record.system_prompts_data)
        INTO prompt_text
        LIMIT 1;
        
        IF prompt_text IS NOT NULL THEN
            -- Insert into system_prompts table
            INSERT INTO system_prompts (
                agent_id,
                user_id,
                prompt_text,
                agent_name,
                agent_purpose,
                agent_owner,
                name,
                description
            ) VALUES (
                agent_record.id,
                agent_record.user_id,
                prompt_text,
                'Triage Orchestra Agent',
                agent_record.purpose,
                'Orchestration Team',
                'Input Triage System Prompt',
                'System prompt for intelligent input routing and orchestration'
            );
            
            RAISE NOTICE 'Successfully migrated Triage Orchestra Agent system prompt';
        ELSE
            RAISE NOTICE 'No system prompt found in JSONB data for Triage Orchestra Agent';
        END IF;
    ELSE
        RAISE NOTICE 'Triage Orchestra Agent not found';
    END IF;
END $$;