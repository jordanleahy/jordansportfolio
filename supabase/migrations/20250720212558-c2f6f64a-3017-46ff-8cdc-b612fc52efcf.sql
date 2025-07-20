
-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN indexes for fuzzy search on company names and industry types
-- These indexes will make similarity queries very fast
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_offerings_company_name_trgm 
ON mv_offerings_enriched USING gin (company_name gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_mv_offerings_industry_trgm 
ON mv_offerings_enriched USING gin (industrygrouptype gin_trgm_ops);

-- Also add indexes on the base tables for better performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_issuers_entityname_trgm 
ON issuers USING gin (entityname gin_trgm_ops);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_offerings_industry_trgm 
ON offerings USING gin (industrygrouptype gin_trgm_ops);
