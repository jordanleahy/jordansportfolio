-- Add custom_cover_image_url field to company_portfolios table
ALTER TABLE public.company_portfolios 
ADD COLUMN custom_cover_image_url TEXT;