-- Create storage policies for job-applications bucket

-- Policy to allow users to upload files to job-applications bucket  
CREATE POLICY "Users can upload to job-applications bucket" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'job-applications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to view their own files in job-applications bucket
CREATE POLICY "Users can view their own files in job-applications bucket" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'job-applications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to update their own files in job-applications bucket
CREATE POLICY "Users can update their own files in job-applications bucket" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'job-applications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own files in job-applications bucket
CREATE POLICY "Users can delete their own files in job-applications bucket" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'job-applications' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);