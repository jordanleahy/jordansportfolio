-- Drop SEC Form D related tables in dependency order
-- This will completely remove all SEC functionality from the database

-- Drop dependent tables first
DROP TABLE IF EXISTS recipients CASCADE;
DROP TABLE IF EXISTS related_persons CASCADE;
DROP TABLE IF EXISTS signatures CASCADE;
DROP TABLE IF EXISTS issuers CASCADE;

-- Drop the materialized view if it exists
DROP MATERIALIZED VIEW IF EXISTS mv_offerings_enriched CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS offerings CASCADE;
DROP TABLE IF EXISTS formd_submission CASCADE;

-- Cleanup any remaining sequences or indexes related to SEC tables
-- (PostgreSQL will automatically clean these up with CASCADE)