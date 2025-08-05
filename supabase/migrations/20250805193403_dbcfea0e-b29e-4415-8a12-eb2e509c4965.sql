-- Remove foreign key constraint from submission_logs table
-- since theme_submissions table was deleted
ALTER TABLE public.submission_logs 
DROP CONSTRAINT IF EXISTS submission_logs_submission_id_fkey;