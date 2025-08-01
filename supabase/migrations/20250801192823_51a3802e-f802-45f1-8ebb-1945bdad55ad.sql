-- Enable real-time for blog_posts table
ALTER TABLE blog_posts REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE blog_posts;