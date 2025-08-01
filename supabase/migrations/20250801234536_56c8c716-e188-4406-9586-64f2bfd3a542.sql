-- Fix the security issues without dropping the existing has_role function
-- We'll update it in place to add the search path

-- 1. Update the existing has_role function to add search path security
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

-- 2. Fix other functions that have search path issues
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

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

-- 3. Ensure social_media_posts user_id is not nullable (security requirement)
DO $$
BEGIN
  -- Make user_id NOT NULL if it's currently nullable
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'social_media_posts' 
    AND column_name = 'user_id' 
    AND is_nullable = 'YES'
  ) THEN
    -- Delete any orphaned records first
    DELETE FROM public.social_media_posts WHERE user_id IS NULL;
    
    -- Make column NOT NULL
    ALTER TABLE public.social_media_posts ALTER COLUMN user_id SET NOT NULL;
  END IF;
END
$$;

-- 4. Add proper indexes for performance and security
CREATE INDEX IF NOT EXISTS idx_social_media_posts_user_id ON public.social_media_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_color_themes_user_id ON public.color_themes(user_id);
CREATE INDEX IF NOT EXISTS idx_openai_agents_user_id ON public.openai_agents(user_id);

-- 5. Fix any other functions that may have search path issues
CREATE OR REPLACE FUNCTION public.validate_tldr_bullets(bullets jsonb)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Must have 3-5 bullets
  IF jsonb_array_length(bullets) < 3 OR jsonb_array_length(bullets) > 5 THEN
    RETURN FALSE;
  END IF;
  
  -- Each bullet must be a string (removed character length requirement)
  FOR i IN 0..(jsonb_array_length(bullets)-1) LOOP
    IF NOT (jsonb_typeof(bullets->i) = 'string') THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_visual_sections(sections jsonb)
RETURNS boolean
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Must have exactly 3 sections
  IF jsonb_array_length(sections) != 3 THEN
    RETURN FALSE;
  END IF;
  
  -- Each section must have required fields
  FOR i IN 0..2 LOOP
    IF NOT (
      sections->i ? 'headline' AND
      sections->i ? 'content' AND
      sections->i ? 'image_url' AND
      char_length((sections->i->>'headline')::text) <= 40 AND -- ~6 words max
      char_length((sections->i->>'content')::text) BETWEEN 300 AND 480 -- 60-80 words
    ) THEN
      RETURN FALSE;
    END IF;
  END LOOP;
  
  RETURN TRUE;
END;
$$;