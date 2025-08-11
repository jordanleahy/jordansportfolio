-- Fix the trigger function that's causing the error
CREATE OR REPLACE FUNCTION public.create_system_prompt_version()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    next_version_number integer;
BEGIN
    -- Get the next version number for this system prompt
    SELECT COALESCE(MAX(version_number), 0) + 1 
    INTO next_version_number
    FROM public.system_prompt_versions 
    WHERE system_prompt_id = NEW.id;
    
    -- Deactivate previous versions
    UPDATE public.system_prompt_versions 
    SET is_active = false 
    WHERE system_prompt_id = NEW.id;
    
    -- Create new version record (removed category field reference)
    INSERT INTO public.system_prompt_versions (
        system_prompt_id,
        version_number,
        prompt_text,
        user_id,
        is_active,
        generated_by,
        change_description,
        metadata
    ) VALUES (
        NEW.id,
        next_version_number,
        NEW.prompt_text,
        NEW.user_id,
        true,
        COALESCE(NEW.generated_by, 'manual'),
        CASE 
            WHEN TG_OP = 'INSERT' THEN 'Initial creation'
            ELSE 'System prompt updated'
        END,
        jsonb_build_object(
            'agent_name', NEW.agent_name,
            'operation', TG_OP
        )
    );
    
    RETURN NEW;
END;
$function$;