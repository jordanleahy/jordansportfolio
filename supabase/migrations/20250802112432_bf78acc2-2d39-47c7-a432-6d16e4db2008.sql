-- Enable real-time for color_themes table
ALTER TABLE public.color_themes REPLICA IDENTITY FULL;

-- Add color_themes to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.color_themes;