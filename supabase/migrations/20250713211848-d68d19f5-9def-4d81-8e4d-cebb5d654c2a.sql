-- Add strategic indexes for better query performance
-- Note: Using regular CREATE INDEX (not CONCURRENTLY) as required by transaction context

-- Index for industry filtering (most common filter)
CREATE INDEX IF NOT EXISTS idx_offerings_industry 
ON public.offerings(industrygrouptype) 
WHERE industrygrouptype IS NOT NULL;

-- Index for amount filtering (used in default filters)
CREATE INDEX IF NOT EXISTS idx_offerings_amounts 
ON public.offerings(totalofferingamount, totalamountsold, totalremaining) 
WHERE totalofferingamount IS NOT NULL AND totalamountsold IS NOT NULL;

-- Index for date sorting (default sort field)
CREATE INDEX IF NOT EXISTS idx_offerings_sale_date 
ON public.offerings(sale_date DESC NULLS LAST);

-- Index for issuers table (for joins)
CREATE INDEX IF NOT EXISTS idx_issuers_accessionnumber 
ON public.issuers(accessionnumber);

-- Index for US companies filter
CREATE INDEX IF NOT EXISTS idx_issuers_country 
ON public.issuers(stateorcountry, stateorcountrydescription) 
WHERE stateorcountry IS NOT NULL;

-- Index for signatures table (for joins)
CREATE INDEX IF NOT EXISTS idx_signatures_accessionnumber 
ON public.signatures(accessionnumber);