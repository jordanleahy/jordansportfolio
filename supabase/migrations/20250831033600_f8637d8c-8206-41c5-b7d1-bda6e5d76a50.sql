-- Update RLS policy to allow access to Visual Prompt Generator system prompts
DROP POLICY IF EXISTS "Users can view their own prompts and system prompts" ON system_prompts;

CREATE POLICY "Users can view their own prompts and system prompts" ON system_prompts
  FOR SELECT USING (
    (auth.uid() = user_id) OR 
    (agent_name IN ('System Prompt Generator', 'Visual Prompt Generator'))
  );