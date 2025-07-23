-- Add resume_text column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN resume_text TEXT;