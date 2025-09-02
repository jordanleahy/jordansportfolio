-- Create street_vision_generations table for tracking Street Vision Agent inputs and outputs
CREATE TABLE public.street_vision_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  user_prompt TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  transformed_image_url TEXT,
  vision_analysis TEXT,
  prompt_model TEXT NOT NULL DEFAULT 'gpt-4-vision-preview',
  image_model TEXT NOT NULL DEFAULT 'dall-e-3',
  processing_time_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'pending',
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.street_vision_generations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create their own street vision generations" 
ON public.street_vision_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own street vision generations" 
ON public.street_vision_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own street vision generations" 
ON public.street_vision_generations 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own street vision generations" 
ON public.street_vision_generations 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all street vision generations" 
ON public.street_vision_generations 
FOR ALL 
USING (auth.role() = 'service_role'::text);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_street_vision_generations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_street_vision_generations_updated_at
BEFORE UPDATE ON public.street_vision_generations
FOR EACH ROW
EXECUTE FUNCTION public.update_street_vision_generations_updated_at();