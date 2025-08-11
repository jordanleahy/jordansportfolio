-- Phase 3: Database Migration - Remove category column from system_prompts table

-- Step 1: Drop the index that depends on the category column
DROP INDEX IF EXISTS idx_system_prompts_category;

-- Step 2: Remove the category column from system_prompts table
ALTER TABLE system_prompts DROP COLUMN IF EXISTS category;