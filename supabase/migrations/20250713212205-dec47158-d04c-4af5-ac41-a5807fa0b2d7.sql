-- Create materialized view for faster common queries
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_offerings_enriched AS 
SELECT 
  o.*,
  i.entityname as company_name,
  i.city as company_city,
  i.stateorcountrydescription as company_location,
  i.stateorcountry as country_code,
  s.nameofsigner as primary_signer,
  CASE 
    WHEN o.totalremaining = 0 OR (o.totalamountsold IS NOT NULL AND o.totalofferingamount IS NOT NULL AND o.totalamountsold >= o.totalofferingamount)
    THEN true
    ELSE false
  END as is_fully_raised,
  CASE 
    WHEN i.stateorcountry IN ('US', 'United States') OR i.stateorcountrydescription ILIKE '%United States%'
    THEN true
    ELSE false
  END as is_us_company
FROM offerings o 
LEFT JOIN (
  SELECT DISTINCT ON (accessionnumber) 
    accessionnumber, entityname, city, stateorcountrydescription, stateorcountry
  FROM issuers 
  WHERE is_primaryissuer_flag = true OR is_primaryissuer_flag IS NULL
  ORDER BY accessionnumber, is_primaryissuer_flag DESC NULLS LAST
) i ON o.accessionnumber = i.accessionnumber
LEFT JOIN (
  SELECT DISTINCT ON (accessionnumber) 
    accessionnumber, nameofsigner
  FROM signatures 
  ORDER BY accessionnumber
) s ON o.accessionnumber = s.accessionnumber;

-- Create index on the materialized view for the most common filter
CREATE INDEX IF NOT EXISTS idx_mv_offerings_tech_filter 
ON mv_offerings_enriched(industrygrouptype, is_fully_raised, is_us_company, totalofferingamount DESC)
WHERE (industrygrouptype ILIKE '%Technology%' OR industrygrouptype ILIKE '%Computer%');

-- Create index for sorting by sale date
CREATE INDEX IF NOT EXISTS idx_mv_offerings_sale_date 
ON mv_offerings_enriched(sale_date DESC NULLS LAST);