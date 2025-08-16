-- Enable realtime for themes table
ALTER TABLE public.themes REPLICA IDENTITY FULL;

-- Add themes table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.themes;