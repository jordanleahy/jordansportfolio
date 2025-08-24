-- Create characters table for storing character analysis and metadata
CREATE TABLE public.characters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  character_name TEXT,
  image_hash TEXT NOT NULL,
  character_description TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'vector',
  sample_image_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, image_hash)
);

-- Create character_generations table for tracking all generations
CREATE TABLE public.character_generations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES public.characters(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_prompt TEXT NOT NULL,
  enhanced_prompt TEXT NOT NULL,
  generated_image_url TEXT NOT NULL,
  style TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_generations ENABLE ROW LEVEL SECURITY;

-- RLS policies for characters table
CREATE POLICY "Users can view their own characters" 
ON public.characters 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own characters" 
ON public.characters 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own characters" 
ON public.characters 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own characters" 
ON public.characters 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS policies for character_generations table
CREATE POLICY "Users can view their own character generations" 
ON public.character_generations 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own character generations" 
ON public.character_generations 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own character generations" 
ON public.character_generations 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for efficient lookups
CREATE INDEX idx_characters_user_id ON public.characters(user_id);
CREATE INDEX idx_characters_image_hash ON public.characters(image_hash);
CREATE INDEX idx_character_generations_character_id ON public.character_generations(character_id);
CREATE INDEX idx_character_generations_user_id ON public.character_generations(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_characters_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_characters_updated_at
BEFORE UPDATE ON public.characters
FOR EACH ROW
EXECUTE FUNCTION public.update_characters_updated_at();