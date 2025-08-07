-- Create images table to track generated images with admin-friendly fields
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT,
  image_url TEXT,
  image_size TEXT,
  image_quality TEXT,
  aspect_ratio TEXT,
  model_used TEXT,
  image_prompt TEXT,
  tokens_used INTEGER,
  estimated_cost NUMERIC DEFAULT 0,
  actual_cost NUMERIC,
  api_usage_tracking_id UUID,
  post_id UUID,
  function_name TEXT,
  request_type TEXT DEFAULT 'image_generation',
  openai_request_id TEXT,
  response_time_ms INTEGER,
  seed_value BIGINT,
  storage_bucket TEXT,
  file_size_bytes BIGINT,
  stage TEXT DEFAULT 'uploaded', -- 'uploaded' | 'generated_only'
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Service role can manage images"
ON public.images
AS PERMISSIVE
FOR ALL
TO public
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all images"
ON public.images
AS PERMISSIVE
FOR SELECT
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own images"
ON public.images
AS PERMISSIVE
FOR SELECT
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own images"
ON public.images
AS PERMISSIVE
FOR INSERT
TO public
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images"
ON public.images
AS PERMISSIVE
FOR UPDATE
TO public
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images"
ON public.images
AS PERMISSIVE
FOR DELETE
TO public
USING (auth.uid() = user_id);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at);
CREATE INDEX IF NOT EXISTS idx_images_api_usage_id ON public.images(api_usage_tracking_id);
CREATE INDEX IF NOT EXISTS idx_images_openai_request_id ON public.images(openai_request_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_images_updated_at ON public.images;
CREATE TRIGGER trg_update_images_updated_at
BEFORE UPDATE ON public.images
FOR EACH ROW
EXECUTE FUNCTION public.update_images_updated_at();

-- Admin insights view combining cost data
CREATE OR REPLACE VIEW public.admin_image_insights AS
SELECT 
  gi.id,
  gi.created_at,
  gi.user_id,
  gi.user_email,
  gi.image_url,
  gi.image_size,
  gi.image_quality,
  gi.aspect_ratio,
  gi.model_used,
  gi.tokens_used,
  COALESCE(gi.estimated_cost, aut.estimated_cost) AS estimated_cost,
  gi.actual_cost,
  gi.function_name,
  gi.request_type,
  gi.response_time_ms,
  gi.post_id,
  gi.openai_request_id,
  gi.stage,
  gi.success,
  gi.error_message
FROM public.images gi
LEFT JOIN public.api_usage_tracking aut
  ON gi.api_usage_tracking_id = aut.id;