-- Create voiceover_scripts table with proper RLS policies for users
CREATE TABLE IF NOT EXISTS public.voiceover_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('blog_post', 'social_media_post')),
  original_content TEXT NOT NULL,
  generated_script TEXT NOT NULL,
  tone TEXT NOT NULL,
  style TEXT NOT NULL,
  word_count INTEGER,
  estimated_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on voiceover_scripts table
ALTER TABLE public.voiceover_scripts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own voiceover scripts
CREATE POLICY "Users can view their own voiceover scripts"
ON public.voiceover_scripts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to create their own voiceover scripts
CREATE POLICY "Users can create their own voiceover scripts"
ON public.voiceover_scripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own voiceover scripts
CREATE POLICY "Users can update their own voiceover scripts"
ON public.voiceover_scripts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own voiceover scripts
CREATE POLICY "Users can delete their own voiceover scripts"
ON public.voiceover_scripts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all voiceover scripts
CREATE POLICY "Admins can view all voiceover scripts"
ON public.voiceover_scripts
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to manage all voiceover scripts
CREATE POLICY "Admins can manage all voiceover scripts"
ON public.voiceover_scripts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for voiceover_scripts
CREATE OR REPLACE FUNCTION public.update_voiceover_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_voiceover_scripts_updated_at
  BEFORE UPDATE ON public.voiceover_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_voiceover_scripts_updated_at();

-- Ensure the current user has the 'user' role
INSERT INTO public.user_roles (user_id, role)
VALUES ('3e7858df-9613-4285-98d2-ffb818c26f6d', 'user'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;