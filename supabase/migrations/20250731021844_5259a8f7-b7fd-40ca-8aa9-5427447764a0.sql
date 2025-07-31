-- Create the social-media-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media-images', 'social-media-images', true);

-- Create storage policies for the social-media-images bucket
CREATE POLICY "Anyone can view social media images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'social-media-images');

CREATE POLICY "Authenticated users can upload social media images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'social-media-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own social media images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'social-media-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own social media images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'social-media-images' AND auth.uid() IS NOT NULL);