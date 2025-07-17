-- Phase 1: Database Optimization - Add performance indexes for SEC tables

-- Index for frequently filtered columns on offerings table
CREATE INDEX IF NOT EXISTS idx_offerings_industry_performance 
ON public.offerings(industrygrouptype, totalofferingamount DESC)
WHERE totalofferingamount IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_offerings_amount_sold_performance 
ON public.offerings(totalamountsold DESC)
WHERE totalamountsold IS NOT NULL AND totalamountsold > 0;

CREATE INDEX IF NOT EXISTS idx_offerings_sale_date_performance 
ON public.offerings(sale_date DESC NULLS LAST)
WHERE sale_date IS NOT NULL;

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_offerings_composite_performance 
ON public.offerings(industrygrouptype, totalofferingamount, totalamountsold, sale_date DESC)
WHERE totalamountsold IS NOT NULL AND totalamountsold > 0;

-- Full-text search index for industry and description fields
CREATE INDEX IF NOT EXISTS idx_offerings_text_search 
ON public.offerings USING gin(to_tsvector('english', 
  COALESCE(industrygrouptype, '') || ' ' || 
  COALESCE(descriptionofothertype, '')
));

-- Index for issuers to improve join performance
CREATE INDEX IF NOT EXISTS idx_issuers_name_location 
ON public.issuers(accessionnumber, entityname, stateorcountry, city);

-- Index for signatures to improve join performance  
CREATE INDEX IF NOT EXISTS idx_signatures_signer_performance 
ON public.signatures(accessionnumber, nameofsigner);