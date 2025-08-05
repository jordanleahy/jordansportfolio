-- Create theme_submissions table for idempotency and rate limiting
CREATE TABLE public.theme_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idempotency_key TEXT NOT NULL,
  category TEXT NOT NULL,
  theme TEXT NOT NULL,
  theme_description TEXT,
  submission_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  inserted_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure unique submissions per user and idempotency key
  CONSTRAINT unique_user_idempotency UNIQUE (user_id, idempotency_key),
  
  -- Ensure theme uniqueness per user (prevent exact duplicates)
  CONSTRAINT unique_user_category_theme UNIQUE (user_id, category, theme)
);

-- Enable RLS
ALTER TABLE public.theme_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own submissions" 
ON public.theme_submissions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own submissions" 
ON public.theme_submissions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions" 
ON public.theme_submissions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions" 
ON public.theme_submissions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_theme_submissions_user_created ON public.theme_submissions(user_id, created_at DESC);
CREATE INDEX idx_theme_submissions_status ON public.theme_submissions(status);
CREATE INDEX idx_theme_submissions_idempotency ON public.theme_submissions(idempotency_key);

-- Add trigger for updated_at
CREATE TRIGGER update_theme_submissions_updated_at
  BEFORE UPDATE ON public.theme_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add function to check rate limits
CREATE OR REPLACE FUNCTION public.check_theme_submission_rate_limit(
  p_user_id UUID,
  p_time_window_minutes INTEGER DEFAULT 5,
  p_max_submissions INTEGER DEFAULT 3
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  submission_count INTEGER;
BEGIN
  -- Count submissions in the time window
  SELECT COUNT(*)
  INTO submission_count
  FROM public.theme_submissions
  WHERE user_id = p_user_id
    AND created_at > (now() - (p_time_window_minutes || ' minutes')::INTERVAL);
  
  -- Return true if under the limit
  RETURN submission_count < p_max_submissions;
END;
$$;

-- Add function to find duplicate themes
CREATE OR REPLACE FUNCTION public.find_duplicate_theme(
  p_user_id UUID,
  p_category TEXT,
  p_theme TEXT
) RETURNS TABLE(
  existing_id UUID,
  existing_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ts.id,
    ts.inserted_count,
    ts.created_at
  FROM public.theme_submissions ts
  WHERE ts.user_id = p_user_id
    AND ts.category = p_category
    AND ts.theme = p_theme
    AND ts.status = 'completed'
  ORDER BY ts.created_at DESC
  LIMIT 1;
END;
$$;

-- Add comprehensive database import function with transaction support
CREATE OR REPLACE FUNCTION public.import_theme_with_transaction(
  p_user_id UUID,
  p_idempotency_key TEXT,
  p_category TEXT,
  p_theme TEXT,
  p_theme_description TEXT,
  p_posts_data JSONB
) RETURNS TABLE(
  success BOOLEAN,
  inserted_count INTEGER,
  submission_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_submission_id UUID;
  v_inserted_count INTEGER := 0;
  post_record JSONB;
  v_error_message TEXT;
BEGIN
  -- Start transaction is implicit in function
  
  -- Check rate limit
  IF NOT public.check_theme_submission_rate_limit(p_user_id) THEN
    RETURN QUERY SELECT false, 0, NULL::UUID, 'Rate limit exceeded. Please wait before submitting again.'::TEXT;
    RETURN;
  END IF;
  
  -- Check for existing submission with same idempotency key
  SELECT id INTO v_submission_id
  FROM public.theme_submissions
  WHERE user_id = p_user_id AND idempotency_key = p_idempotency_key;
  
  IF v_submission_id IS NOT NULL THEN
    -- Return existing submission result
    RETURN QUERY 
    SELECT 
      (status = 'completed') as success,
      COALESCE(inserted_count, 0) as inserted_count,
      id as submission_id,
      error_message
    FROM public.theme_submissions
    WHERE id = v_submission_id;
    RETURN;
  END IF;
  
  -- Create new submission record
  INSERT INTO public.theme_submissions (
    user_id, idempotency_key, category, theme, theme_description, 
    submission_data, status
  ) VALUES (
    p_user_id, p_idempotency_key, p_category, p_theme, p_theme_description,
    p_posts_data, 'processing'
  ) RETURNING id INTO v_submission_id;
  
  -- Check for duplicate theme
  IF EXISTS (
    SELECT 1 FROM public.find_duplicate_theme(p_user_id, p_category, p_theme)
  ) THEN
    -- Mark as failed due to duplicate
    UPDATE public.theme_submissions 
    SET 
      status = 'failed',
      error_message = 'Duplicate theme detected. A theme with this category and name already exists.',
      updated_at = now()
    WHERE id = v_submission_id;
    
    RETURN QUERY SELECT false, 0, v_submission_id, 'Duplicate theme detected. A theme with this category and name already exists.'::TEXT;
    RETURN;
  END IF;
  
  BEGIN
    -- Insert posts using existing function
    SELECT public.insert_category_content(p_category, p_posts_data, p_theme_description) 
    INTO v_inserted_count;
    
    -- Mark submission as completed
    UPDATE public.theme_submissions 
    SET 
      status = 'completed',
      inserted_count = v_inserted_count,
      completed_at = now(),
      updated_at = now()
    WHERE id = v_submission_id;
    
    RETURN QUERY SELECT true, v_inserted_count, v_submission_id, NULL::TEXT;
    
  EXCEPTION WHEN OTHERS THEN
    -- Handle any errors during insertion
    v_error_message := SQLERRM;
    
    -- Mark submission as failed
    UPDATE public.theme_submissions 
    SET 
      status = 'failed',
      error_message = v_error_message,
      updated_at = now()
    WHERE id = v_submission_id;
    
    RETURN QUERY SELECT false, 0, v_submission_id, v_error_message;
  END;
END;
$$;