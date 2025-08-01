-- Fix critical security issues: Add missing RLS policies and security definer functions

-- 1. First, fix the has_role function search path (security issue from linter)
DROP FUNCTION IF EXISTS public.has_role(uuid, app_role);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 2. Create a user role table if it doesn't exist and ensure proper user roles
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage all user roles" ON public.user_roles;
CREATE POLICY "Service role can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role');

-- 3. Create trigger for new user roles
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user'::public.app_role);
  RETURN NEW;
END;
$$;

-- Create trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Fix search path issues for other functions
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 5. Ensure proper authentication checks for sensitive tables
-- Add admin check for API usage tracking
DROP POLICY IF EXISTS "Only admins and service role can view usage data" ON public.api_usage_tracking;
CREATE POLICY "Only admins and service role can view usage data" 
ON public.api_usage_tracking 
FOR SELECT 
USING (
  auth.role() = 'service_role' OR 
  public.has_role(auth.uid(), 'admin'::app_role)
);

-- 6. Ensure social_media_posts user_id is not nullable (security requirement)
-- First check if the column is nullable
DO $$
BEGIN
  -- Make user_id NOT NULL if it's currently nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_posts' 
    AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- Update any null user_id values first (shouldn't exist but safety check)
    UPDATE public.social_media_posts 
    SET user_id = auth.uid() 
    WHERE user_id IS NULL AND auth.uid() IS NOT NULL;
    
    -- Delete any orphaned records
    DELETE FROM public.social_media_posts WHERE user_id IS NULL;
    
    -- Make column NOT NULL
    ALTER TABLE public.social_media_posts ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;

-- 7. Create app_role enum if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'user');
  END IF;
END
$$;

-- 8. Add proper indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_social_media_posts_user_id ON public.social_media_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_color_themes_user_id ON public.color_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_openai_agents_user_id ON public.openai_agents(user_id);