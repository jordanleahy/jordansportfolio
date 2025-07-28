-- Add poster URL fields to company_portfolios table
ALTER TABLE public.company_portfolios 
ADD COLUMN custom_poster_url TEXT,
ADD COLUMN custom_top_poster_url TEXT;

-- Add comments for the new columns
COMMENT ON COLUMN public.company_portfolios.custom_poster_url IS 'URL for custom poster/cover image for the main video';
COMMENT ON COLUMN public.company_portfolios.custom_top_poster_url IS 'URL for custom poster/cover image for the top video';