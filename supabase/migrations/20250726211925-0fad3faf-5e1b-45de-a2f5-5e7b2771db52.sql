-- Create voiceover_scripts table for storing generated scripts
CREATE TABLE public.voiceover_scripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  source_id UUID NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('blog_post', 'social_media_post')),
  original_content TEXT NOT NULL,
  generated_script TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'engaging',
  style TEXT NOT NULL DEFAULT 'teleprompter',
  word_count INTEGER,
  estimated_duration_seconds INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.voiceover_scripts ENABLE ROW LEVEL SECURITY;

-- Create policies for voiceover_scripts
CREATE POLICY "Users can view their own voiceover scripts" 
ON public.voiceover_scripts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own voiceover scripts" 
ON public.voiceover_scripts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own voiceover scripts" 
ON public.voiceover_scripts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own voiceover scripts" 
ON public.voiceover_scripts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_voiceover_scripts_updated_at
BEFORE UPDATE ON public.voiceover_scripts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();