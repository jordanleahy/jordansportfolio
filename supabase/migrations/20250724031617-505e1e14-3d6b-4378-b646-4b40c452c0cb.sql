-- Add basic_info column to comparisons table
ALTER TABLE public.comparisons 
ADD COLUMN basic_info jsonb NOT NULL DEFAULT '[]'::jsonb;