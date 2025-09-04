-- Create secure access control for case studies and cofactor content
CREATE TABLE public.content_access (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content_type text NOT NULL CHECK (content_type IN ('case_study', 'cofactor')),
  access_granted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, content_type)
);

-- Enable RLS
ALTER TABLE public.content_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own access records
CREATE POLICY "Users can view their own content access"
ON public.content_access
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to grant access after password verification
CREATE OR REPLACE FUNCTION public.grant_content_access(content_type_param text, password_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id uuid;
  valid_password boolean := false;
BEGIN
  -- Get current user
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check password based on content type
  IF content_type_param = 'case_study' AND password_param = 'PawPatrolRocks' THEN
    valid_password := true;
  ELSIF content_type_param = 'cofactor' AND password_param = 'chicago' THEN
    valid_password := true;
  END IF;

  -- If password is valid, grant access
  IF valid_password THEN
    INSERT INTO public.content_access (user_id, content_type)
    VALUES (current_user_id, content_type_param)
    ON CONFLICT (user_id, content_type) 
    DO UPDATE SET access_granted_at = now();
    
    RETURN true;
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- Create function to check if user has access
CREATE OR REPLACE FUNCTION public.has_content_access(content_type_param text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.content_access 
    WHERE user_id = auth.uid() 
      AND content_type = content_type_param
  );
$$;

-- Fix remaining database functions missing search_path
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Add any other functions I may have missed (these are common trigger functions)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN
        SELECT p.proname, n.nspname
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname LIKE '%updated_at%'
        AND NOT EXISTS (
            SELECT 1 FROM pg_proc_config 
            WHERE pg_proc_config.procoid = p.oid 
            AND pg_proc_config.configitem LIKE 'search_path%'
        )
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public', func_record.proname);
        EXCEPTION WHEN OTHERS THEN
            -- Skip if function doesn't exist or has different signature
            CONTINUE;
        END;
    END LOOP;
END
$$;