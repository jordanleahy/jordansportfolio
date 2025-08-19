-- Drop existing policies if they exist and recreate them to ensure proper access for all authenticated users
DROP POLICY IF EXISTS "Users can view their own voiceover scripts" ON public.voiceover_scripts;
DROP POLICY IF EXISTS "Users can create their own voiceover scripts" ON public.voiceover_scripts;
DROP POLICY IF EXISTS "Users can update their own voiceover scripts" ON public.voiceover_scripts;
DROP POLICY IF EXISTS "Users can delete their own voiceover scripts" ON public.voiceover_scripts;
DROP POLICY IF EXISTS "Admins can view all voiceover scripts" ON public.voiceover_scripts;
DROP POLICY IF EXISTS "Admins can manage all voiceover scripts" ON public.voiceover_scripts;

-- Create policies that allow ALL authenticated users (including those with 'user' role) to access voiceover scripts
CREATE POLICY "Authenticated users can view their own voiceover scripts"
ON public.voiceover_scripts
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create their own voiceover scripts"
ON public.voiceover_scripts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own voiceover scripts"
ON public.voiceover_scripts
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete their own voiceover scripts"
ON public.voiceover_scripts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Additional policy for admins to manage all scripts
CREATE POLICY "Admins can manage all voiceover scripts"
ON public.voiceover_scripts
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Ensure the current user has both admin and user roles for testing
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('3e7858df-9613-4285-98d2-ffb818c26f6d', 'user'::app_role),
  ('3e7858df-9613-4285-98d2-ffb818c26f6d', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;