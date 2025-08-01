-- Enable realtime for openai_agents table
ALTER TABLE public.openai_agents REPLICA IDENTITY FULL;

-- Add the table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.openai_agents;