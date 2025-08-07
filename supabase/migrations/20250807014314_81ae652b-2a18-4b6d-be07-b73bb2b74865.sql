-- Add OpenAI sync columns to api_usage_tracking table
ALTER TABLE public.api_usage_tracking 
ADD COLUMN IF NOT EXISTS openai_request_id TEXT,
ADD COLUMN IF NOT EXISTS openai_synced BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS actual_cost NUMERIC,
ADD COLUMN IF NOT EXISTS sync_attempted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sync_error_message TEXT;

-- Create indexes for faster sync queries
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_sync_status ON public.api_usage_tracking(sync_status);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_openai_synced ON public.api_usage_tracking(openai_synced);
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_created_at ON public.api_usage_tracking(created_at);

-- Create openai_usage_sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS public.openai_usage_sync_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sync_date DATE NOT NULL,
    sync_type TEXT NOT NULL DEFAULT 'manual',
    sync_status TEXT NOT NULL DEFAULT 'pending',
    records_synced INTEGER DEFAULT 0,
    total_cost_synced NUMERIC DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the new table
ALTER TABLE public.openai_usage_sync_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for openai_usage_sync_logs
CREATE POLICY "Admins can manage all sync logs" ON public.openai_usage_sync_logs
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_openai_usage_sync_logs_sync_date ON public.openai_usage_sync_logs(sync_date);
CREATE INDEX IF NOT EXISTS idx_openai_usage_sync_logs_created_at ON public.openai_usage_sync_logs(created_at);

-- Add trigger for updated_at (without IF NOT EXISTS)
CREATE OR REPLACE FUNCTION public.update_openai_usage_sync_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_openai_usage_sync_logs_updated_at ON public.openai_usage_sync_logs;
CREATE TRIGGER update_openai_usage_sync_logs_updated_at
  BEFORE UPDATE ON public.openai_usage_sync_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_openai_usage_sync_logs_updated_at();