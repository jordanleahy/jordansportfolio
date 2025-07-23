-- Add resume_text column to job_applications table
ALTER TABLE public.job_applications 
ADD COLUMN resume_text TEXT;

-- Add a comment to document the purpose
COMMENT ON COLUMN public.job_applications.resume_text IS 'Raw text content of user resume for comparison with job descriptions';