-- Create table to track system prompt version history
CREATE TABLE public.system_prompt_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    system_prompt_id uuid NOT NULL REFERENCES public.system_prompts(id) ON DELETE CASCADE,
    version_number integer NOT NULL,
    prompt_text text NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    change_description text,
    is_active boolean NOT NULL DEFAULT false,
    generated_by text DEFAULT 'manual', -- 'manual', 'system_prompt_generator', 'migration', etc.
    metadata jsonb DEFAULT '{}',
    
    -- Ensure version numbers are unique per system prompt
    UNIQUE(system_prompt_id, version_number)
);

-- Create partial unique index to ensure only one active version per system prompt
CREATE UNIQUE INDEX idx_system_prompt_versions_active_unique 
ON public.system_prompt_versions(system_prompt_id) 
WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.system_prompt_versions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view version history for their system prompts"
    ON public.system_prompt_versions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.system_prompts sp 
            WHERE sp.id = system_prompt_versions.system_prompt_id 
            AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create version history for their system prompts"
    ON public.system_prompt_versions
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.system_prompts sp 
            WHERE sp.id = system_prompt_versions.system_prompt_id 
            AND sp.user_id = auth.uid()
        )
        AND user_id = auth.uid()
    );

CREATE POLICY "Users can update version history for their system prompts"
    ON public.system_prompt_versions
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.system_prompts sp 
            WHERE sp.id = system_prompt_versions.system_prompt_id 
            AND sp.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete version history for their system prompts"
    ON public.system_prompt_versions
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.system_prompts sp 
            WHERE sp.id = system_prompt_versions.system_prompt_id 
            AND sp.user_id = auth.uid()
        )
    );

-- Create function to automatically create version history when system prompts are updated
CREATE OR REPLACE FUNCTION public.create_system_prompt_version()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    
    -- Create new version record
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
            'category', NEW.category,
            'operation', TG_OP
        )
    );
    
    RETURN NEW;
END;
$$;

-- Create trigger to automatically version system prompts
CREATE TRIGGER system_prompt_versioning_trigger
    AFTER INSERT OR UPDATE OF prompt_text ON public.system_prompts
    FOR EACH ROW
    EXECUTE FUNCTION public.create_system_prompt_version();

-- Add generated_by column to system_prompts table for better tracking
ALTER TABLE public.system_prompts 
ADD COLUMN IF NOT EXISTS generated_by text DEFAULT 'manual';

-- Create index for better performance on version queries
CREATE INDEX idx_system_prompt_versions_prompt_id ON public.system_prompt_versions(system_prompt_id);
CREATE INDEX idx_system_prompt_versions_created_at ON public.system_prompt_versions(created_at DESC);