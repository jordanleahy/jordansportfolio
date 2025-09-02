-- Create street-vision storage bucket for organized image management
INSERT INTO storage.buckets (id, name, public) VALUES ('street-vision', 'street-vision', true);

-- Create RLS policies for street-vision bucket
CREATE POLICY "Users can upload their own street vision images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'street-vision' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own street vision images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'street-vision' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own street vision images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'street-vision' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own street vision images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'street-vision' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add original_filename column to track the original file name
ALTER TABLE public.street_vision_generations 
ADD COLUMN original_filename text;