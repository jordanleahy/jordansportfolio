-- Remove key_benefits and unique_strengths columns from comparison_companies table
-- Since there's no existing data, this is safe to do

ALTER TABLE public.comparison_companies 
DROP COLUMN IF EXISTS key_benefits,
DROP COLUMN IF EXISTS unique_strengths;