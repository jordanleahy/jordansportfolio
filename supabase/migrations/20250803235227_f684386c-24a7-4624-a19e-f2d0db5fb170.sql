-- Enable realtime for social_media_posts table
ALTER TABLE public.social_media_posts REPLICA IDENTITY FULL;

-- Add table to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.social_media_posts;