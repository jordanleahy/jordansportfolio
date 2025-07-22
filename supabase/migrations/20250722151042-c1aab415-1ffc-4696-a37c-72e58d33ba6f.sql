-- Create cached_prompts table for storing generated prompts
CREATE TABLE public.cached_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  prompt_text TEXT NOT NULL,
  category TEXT NOT NULL,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cached_prompts ENABLE ROW LEVEL SECURITY;

-- Create policies for cached prompts
CREATE POLICY "Users can view their own cached prompts" 
ON public.cached_prompts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cached prompts" 
ON public.cached_prompts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cached prompts" 
ON public.cached_prompts 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_cached_prompts_updated_at
BEFORE UPDATE ON public.cached_prompts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();