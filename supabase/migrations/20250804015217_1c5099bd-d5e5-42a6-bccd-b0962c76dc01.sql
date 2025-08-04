-- Create theme_descriptions table to store theme information and descriptions
CREATE TABLE public.theme_descriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one theme per category per user
  UNIQUE(user_id, category, theme)
);

-- Enable Row Level Security
ALTER TABLE public.theme_descriptions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own theme descriptions" 
ON public.theme_descriptions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own theme descriptions" 
ON public.theme_descriptions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own theme descriptions" 
ON public.theme_descriptions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own theme descriptions" 
ON public.theme_descriptions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_theme_descriptions_updated_at
BEFORE UPDATE ON public.theme_descriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();