-- Enable realtime for system_prompts table
ALTER TABLE public.system_prompts REPLICA IDENTITY FULL;

-- Add system_prompts to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_prompts;

-- Migrate existing agent system prompts to the new table
SELECT migrate_agent_system_prompts();