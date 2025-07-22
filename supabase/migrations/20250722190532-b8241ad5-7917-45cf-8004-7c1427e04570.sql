-- Add file attachment columns to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN attachment_url TEXT,
ADD COLUMN attachment_filename TEXT,
ADD COLUMN attachment_type TEXT;