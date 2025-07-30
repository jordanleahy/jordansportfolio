-- Create API usage tracking table
CREATE TABLE public.api_usage_tracking (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  function_name text NOT NULL,
  model_used text NOT NULL,
  request_type text NOT NULL CHECK (request_type IN ('text_generation', 'image_generation', 'image_prompt')),
  tokens_used integer,
  image_size text,
  image_quality text,
  estimated_cost decimal(10,6) NOT NULL DEFAULT 0,
  success boolean NOT NULL DEFAULT false,
  error_message text,
  request_metadata jsonb DEFAULT '{}',
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  response_time_ms integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.api_usage_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all usage data" 
ON public.api_usage_tracking 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert usage data" 
ON public.api_usage_tracking 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Service role can update usage data" 
ON public.api_usage_tracking 
FOR UPDATE 
USING (auth.role() = 'service_role');

-- Create indexes for better query performance
CREATE INDEX idx_api_usage_user_id ON public.api_usage_tracking(user_id);
CREATE INDEX idx_api_usage_created_at ON public.api_usage_tracking(created_at DESC);
CREATE INDEX idx_api_usage_function_name ON public.api_usage_tracking(function_name);
CREATE INDEX idx_api_usage_success ON public.api_usage_tracking(success);
CREATE INDEX idx_api_usage_cost ON public.api_usage_tracking(estimated_cost DESC);

-- Create composite indexes for common queries
CREATE INDEX idx_api_usage_user_date ON public.api_usage_tracking(user_id, created_at DESC);
CREATE INDEX idx_api_usage_function_date ON public.api_usage_tracking(function_name, created_at DESC);

-- Create updated_at trigger
CREATE TRIGGER update_api_usage_tracking_updated_at
BEFORE UPDATE ON public.api_usage_tracking
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();