
-- Add custom_image_url column to company_portfolios table
ALTER TABLE public.company_portfolios 
ADD COLUMN custom_image_url text;
