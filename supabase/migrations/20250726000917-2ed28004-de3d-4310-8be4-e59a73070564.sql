-- Fix RLS policies for social_media_posts table
-- Current policies allow users to see/modify ALL posts, but they should only see their own

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view all social media posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Authenticated users can update all social media posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Authenticated users can delete all social media posts" ON public.social_media_posts;
DROP POLICY IF EXISTS "Authenticated users can create social media posts" ON public.social_media_posts;

-- Create proper user-scoped policies
CREATE POLICY "Users can view their own social media posts" 
ON public.social_media_posts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social media posts" 
ON public.social_media_posts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social media posts" 
ON public.social_media_posts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social media posts" 
ON public.social_media_posts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Fix home_health table - it has no RLS policies but RLS is enabled
-- Assuming this should be publicly readable for research/analysis purposes
CREATE POLICY "Home health data is publicly viewable" 
ON public.home_health 
FOR SELECT 
USING (true);

-- Fix search path for database functions to prevent search path attacks
-- Update the has_role function to set search path
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Update other security definer functions to set search path
CREATE OR REPLACE FUNCTION public.create_default_user_settings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$;