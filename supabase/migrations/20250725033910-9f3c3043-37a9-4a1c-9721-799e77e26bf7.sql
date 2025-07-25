-- Remove dead JSONB fields from comparisons table
-- These fields are legacy and no longer used - data is now stored in normalized tables

ALTER TABLE public.comparisons 
DROP COLUMN IF EXISTS company1_data,
DROP COLUMN IF EXISTS company2_data,
DROP COLUMN IF EXISTS features,
DROP COLUMN IF EXISTS summary_insights,
DROP COLUMN IF EXISTS use_cases,
DROP COLUMN IF EXISTS basic_info;