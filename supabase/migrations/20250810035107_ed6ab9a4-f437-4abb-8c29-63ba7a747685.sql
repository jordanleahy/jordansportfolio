-- Add include_in_library and featured columns to shared_collections
ALTER TABLE public.shared_collections
ADD COLUMN IF NOT EXISTS include_in_library boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

-- Indexes to optimize Library queries
CREATE INDEX IF NOT EXISTS idx_shared_collections_include_status 
  ON public.shared_collections (include_in_library, status);

CREATE INDEX IF NOT EXISTS idx_shared_collections_featured 
  ON public.shared_collections (featured);

-- Helpful for sorting newest first when listing
CREATE INDEX IF NOT EXISTS idx_shared_collections_published_at 
  ON public.shared_collections (published_at);