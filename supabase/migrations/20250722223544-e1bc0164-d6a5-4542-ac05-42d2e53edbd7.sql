
-- Phase 1: Database Design & Relationships

-- First, let's expand the cached_prompts table structure
ALTER TABLE public.cached_prompts 
ADD COLUMN IF NOT EXISTS source_table TEXT,
ADD COLUMN IF NOT EXISTS source_id UUID,
ADD COLUMN IF NOT EXISTS prompt_type TEXT DEFAULT 'image_generation',
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS parent_prompt_id UUID REFERENCES public.cached_prompts(id),
ADD COLUMN IF NOT EXISTS effectiveness_score DECIMAL(3,2) DEFAULT 0.0;

-- Create enum for prompt types
CREATE TYPE prompt_type AS ENUM (
  'image_generation',
  'content_creation', 
  'research',
  'social_media',
  'blog_visual',
  'custom'
);

-- Update the column to use the enum
ALTER TABLE public.cached_prompts 
ALTER COLUMN prompt_type TYPE prompt_type USING prompt_type::prompt_type;

-- Create prompt_usage_log table
CREATE TABLE public.prompt_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id UUID NOT NULL REFERENCES public.cached_prompts(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN DEFAULT true,
  execution_time_ms INTEGER,
  api_cost DECIMAL(10,4),
  result_quality_score DECIMAL(3,2),
  context_data JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for prompt_usage_log
ALTER TABLE public.prompt_usage_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prompt_usage_log
CREATE POLICY "Users can view their own prompt usage logs" 
ON public.prompt_usage_log 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own prompt usage logs" 
ON public.prompt_usage_log 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Add missing DELETE policy for cached_prompts
CREATE POLICY "Users can delete their own cached prompts" 
ON public.cached_prompts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cached_prompts_source ON public.cached_prompts(source_table, source_id);
CREATE INDEX IF NOT EXISTS idx_cached_prompts_type ON public.cached_prompts(prompt_type);
CREATE INDEX IF NOT EXISTS idx_cached_prompts_user_category ON public.cached_prompts(user_id, category);
CREATE INDEX IF NOT EXISTS idx_cached_prompts_tags ON public.cached_prompts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_cached_prompts_templates ON public.cached_prompts(is_template) WHERE is_template = true;
CREATE INDEX IF NOT EXISTS idx_cached_prompts_favorites ON public.cached_prompts(user_id, is_favorite) WHERE is_favorite = true;

CREATE INDEX IF NOT EXISTS idx_prompt_usage_log_prompt_id ON public.prompt_usage_log(prompt_id);
CREATE INDEX IF NOT EXISTS idx_prompt_usage_log_user_date ON public.prompt_usage_log(user_id, used_at);

-- Create trigger for updating usage statistics
CREATE OR REPLACE FUNCTION public.update_prompt_usage_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.cached_prompts 
    SET 
      usage_count = usage_count + 1,
      last_used_at = NEW.used_at,
      effectiveness_score = (
        SELECT COALESCE(AVG(result_quality_score), 0.0)
        FROM public.prompt_usage_log 
        WHERE prompt_id = NEW.prompt_id 
        AND result_quality_score IS NOT NULL
      )
    WHERE id = NEW.prompt_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_prompt_usage_stats_trigger
AFTER INSERT ON public.prompt_usage_log
FOR EACH ROW
EXECUTE FUNCTION public.update_prompt_usage_stats();

-- Create function to safely delete prompts with cleanup
CREATE OR REPLACE FUNCTION public.safe_delete_prompt(prompt_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prompt_exists BOOLEAN;
BEGIN
  -- Check if prompt exists and belongs to user
  SELECT EXISTS(
    SELECT 1 FROM public.cached_prompts 
    WHERE id = prompt_id AND user_id = auth.uid()
  ) INTO prompt_exists;
  
  IF NOT prompt_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Delete usage logs first (cascade should handle this, but being explicit)
  DELETE FROM public.prompt_usage_log WHERE prompt_id = prompt_id;
  
  -- Delete the prompt
  DELETE FROM public.cached_prompts WHERE id = prompt_id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
