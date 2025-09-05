-- Enable realtime for themes table
ALTER TABLE public.themes REPLICA IDENTITY FULL;

-- Add themes table to realtime publication if not already added
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'themes'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.themes;
    END IF;
END $$;