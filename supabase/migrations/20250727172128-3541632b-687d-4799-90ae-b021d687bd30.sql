-- Update the clover-health portfolio status to published so it can be viewed publicly
UPDATE public.company_portfolios 
SET status = 'published' 
WHERE company_slug = 'clover-health';