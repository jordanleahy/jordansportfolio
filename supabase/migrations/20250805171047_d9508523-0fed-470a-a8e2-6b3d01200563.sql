-- Phase 3a: Add deleted status to enum (must be in separate transaction)

-- Add 'deleted' status to the post_status enum if it doesn't exist
DO $$ 
BEGIN
  -- Check if 'deleted' value exists in post_status enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'deleted' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'post_status')
  ) THEN
    -- Add 'deleted' to the enum
    ALTER TYPE post_status ADD VALUE 'deleted';
  END IF;
END $$;