-- Create submission tracking table for enhanced duplicate prevention
CREATE TABLE IF NOT EXISTS public.theme_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  theme_name TEXT NOT NULL,
  category TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  theme_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  UNIQUE(idempotency_key)
);

-- Enable RLS
ALTER TABLE public.theme_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can manage their own submissions"
  ON public.theme_submissions
  FOR ALL
  USING (auth.uid() = user_id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_theme_submissions_user_key 
  ON public.theme_submissions(user_id, idempotency_key);

CREATE INDEX IF NOT EXISTS idx_theme_submissions_status 
  ON public.theme_submissions(status, created_at);

-- Cleanup function for old submissions (24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_submissions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.theme_submissions 
  WHERE created_at < now() - INTERVAL '24 hours'
    AND status IN ('completed', 'failed');
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;