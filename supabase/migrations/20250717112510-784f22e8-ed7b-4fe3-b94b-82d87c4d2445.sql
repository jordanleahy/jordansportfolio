-- Create storage policies for the general bucket to allow video uploads

-- Allow public access to view files in the general bucket
CREATE POLICY "General files are publicly accessible" 
ON storage.objects 
FOR SELECT 
TO public
USING (bucket_id = 'general');

-- Allow authenticated users to upload files to the general bucket
CREATE POLICY "Authenticated users can upload to general bucket" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'general');

-- Allow users to update files they uploaded to the general bucket
CREATE POLICY "Users can update their own general files" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (bucket_id = 'general' AND auth.uid() = owner);

-- Allow users to delete files they uploaded to the general bucket
CREATE POLICY "Users can delete their own general files" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (bucket_id = 'general' AND auth.uid() = owner);