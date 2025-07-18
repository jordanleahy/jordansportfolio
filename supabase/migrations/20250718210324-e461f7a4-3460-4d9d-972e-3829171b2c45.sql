-- Add job_description_link column to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN job_description_link text;