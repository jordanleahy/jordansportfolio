-- Create indexes for optimal summary stats performance
CREATE INDEX IF NOT EXISTS idx_offerings_totalofferingamount ON public.offerings (totalofferingamount) WHERE totalofferingamount IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offerings_sale_date ON public.offerings (sale_date) WHERE sale_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_offerings_industry_amount ON public.offerings (industrygrouptype, totalofferingamount) WHERE industrygrouptype IS NOT NULL AND totalofferingamount IS NOT NULL;

-- Create a materialized view for summary stats (refreshed periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.offering_summary_stats AS
SELECT 
  COUNT(*) as total_offerings,
  COALESCE(SUM(CAST(totalofferingamount AS NUMERIC)), 0) as total_amount,
  COALESCE(AVG(CAST(totalofferingamount AS NUMERIC)), 0) as average_amount,
  COUNT(CASE WHEN sale_date >= date_trunc('month', CURRENT_DATE) THEN 1 END) as this_month_offerings,
  COALESCE(SUM(CASE WHEN sale_date >= date_trunc('month', CURRENT_DATE) THEN CAST(totalofferingamount AS NUMERIC) ELSE 0 END), 0) as this_month_amount
FROM public.offerings 
WHERE totalofferingamount IS NOT NULL;

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_offering_summary_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW public.offering_summary_stats;
END;
$$ LANGUAGE plpgsql;