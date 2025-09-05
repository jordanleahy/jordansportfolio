-- Remove cover letter functionality from database
ALTER TABLE public.company_portfolios DROP COLUMN IF EXISTS cover_letter;
ALTER TABLE public.job_applications DROP COLUMN IF EXISTS cover_letter_link;

-- Drop the cover letter agent function if it exists
DROP FUNCTION IF EXISTS public.insert_cover_letter_agent();