-- Drop and recreate functions that still reference the non-existent category column

-- Drop the problematic functions
DROP FUNCTION IF EXISTS public.insert_engineering_work_report_agent();
DROP FUNCTION IF EXISTS public.insert_image_enhancement_agent();

-- Recreate insert_engineering_work_report_agent without category column
CREATE OR REPLACE FUNCTION public.insert_engineering_work_report_agent()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    agent_id uuid;
    system_prompt_id uuid;
BEGIN
    -- Insert the system prompt without category column
    INSERT INTO public.system_prompts (
        agent_name, 
        prompt_text, 
        user_id, 
        generated_by
    ) VALUES (
        'Engineering Work Report Agent',
        'You are an expert engineering work report generator. Create comprehensive work reports based on the provided context and requirements.',
        auth.uid(),
        'system'
    ) RETURNING id INTO system_prompt_id;

    -- Insert the OpenAI agent
    INSERT INTO public.openai_agents (
        name,
        description,
        system_prompt_id,
        user_id,
        model,
        temperature,
        max_tokens,
        is_active
    ) VALUES (
        'Engineering Work Report Agent',
        'Generates detailed engineering work reports',
        system_prompt_id,
        auth.uid(),
        'gpt-4',
        0.7,
        2000,
        true
    ) RETURNING id INTO agent_id;

    RETURN agent_id;
END;
$function$;

-- Recreate insert_image_enhancement_agent without category column
CREATE OR REPLACE FUNCTION public.insert_image_enhancement_agent()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    agent_id uuid;
    system_prompt_id uuid;
BEGIN
    -- Insert the system prompt without category column
    INSERT INTO public.system_prompts (
        agent_name, 
        prompt_text, 
        user_id, 
        generated_by
    ) VALUES (
        'Image Enhancement Agent',
        'You are an expert image enhancement agent. Analyze and enhance images based on the provided requirements and context.',
        auth.uid(),
        'system'
    ) RETURNING id INTO system_prompt_id;

    -- Insert the OpenAI agent
    INSERT INTO public.openai_agents (
        name,
        description,
        system_prompt_id,
        user_id,
        model,
        temperature,
        max_tokens,
        is_active
    ) VALUES (
        'Image Enhancement Agent',
        'Enhances and optimizes images',
        system_prompt_id,
        auth.uid(),
        'gpt-4-vision-preview',
        0.5,
        1500,
        true
    ) RETURNING id INTO agent_id;

    RETURN agent_id;
END;
$function$;