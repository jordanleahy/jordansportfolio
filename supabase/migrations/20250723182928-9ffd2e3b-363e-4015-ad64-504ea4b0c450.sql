-- Add resume_text column to vendor_jobs table
ALTER TABLE public.vendor_jobs 
ADD COLUMN resume_text TEXT;

-- Add a comment to document the purpose
COMMENT ON COLUMN public.vendor_jobs.resume_text IS 'Raw text content of user resume for this specific job application';