-- Create storage bucket for job application files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('job-applications', 'job-applications', false);

-- Create storage policies for job application files
CREATE POLICY "Users can upload their own job application files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'job-applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own job application files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'job-applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own job application files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'job-applications' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own job application files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'job-applications' AND auth.uid()::text = (storage.foldername(name))[1]);