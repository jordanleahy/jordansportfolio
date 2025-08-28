-- Create storage bucket for theme covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('theme-covers', 'theme-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for theme-covers bucket
CREATE POLICY "Theme covers are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'theme-covers');

CREATE POLICY "Users can upload their own theme covers" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'theme-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own theme covers" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'theme-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own theme covers" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'theme-covers' AND auth.uid()::text = (storage.foldername(name))[1]);