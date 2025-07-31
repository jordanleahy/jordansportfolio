-- Add Open Graph metadata fields to company_portfolios table
ALTER TABLE public.company_portfolios 
ADD COLUMN og_title TEXT,
ADD COLUMN og_description TEXT,
ADD COLUMN og_image_url TEXT;

-- Add helpful comments for the new columns
COMMENT ON COLUMN public.company_portfolios.og_title IS 'Custom Open Graph title for social media sharing';
COMMENT ON COLUMN public.company_portfolios.og_description IS 'Custom Open Graph description for social media sharing';
COMMENT ON COLUMN public.company_portfolios.og_image_url IS 'Custom Open Graph image URL for social media sharing';