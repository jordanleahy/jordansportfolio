-- Migration: Remove Legacy system_prompts Column
-- This removes the deprecated system_prompts JSON column from openai_agents table
-- All valuable prompts have been migrated to the new system_prompts table

DO $$
BEGIN
  -- Log start of cleanup
  RAISE NOTICE 'Starting removal of legacy system_prompts column from openai_agents table...';
  
  -- Check if column exists before attempting to drop it
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'openai_agents' 
      AND column_name = 'system_prompts'
      AND table_schema = 'public'
  ) THEN
    -- Drop the legacy system_prompts column
    ALTER TABLE public.openai_agents DROP COLUMN system_prompts;
    RAISE NOTICE '✅ Successfully removed system_prompts column from openai_agents table';
  ELSE
    RAISE NOTICE '⏭️  Column system_prompts does not exist in openai_agents table';
  END IF;
  
  -- Verify the column was removed
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'openai_agents' 
      AND column_name = 'system_prompts'
      AND table_schema = 'public'
  ) THEN
    RAISE NOTICE '✅ Confirmed: system_prompts column has been removed';
  ELSE
    RAISE WARNING '❌ Column removal failed - system_prompts still exists';
  END IF;
  
  RAISE NOTICE 'Legacy cleanup completed! The openai_agents table now uses the new system_prompts table architecture.';
END $$;