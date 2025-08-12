-- Create image_versions table for tracking all image edits
CREATE TABLE public.image_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL,
  aspect_ratio TEXT NOT NULL,
  original_url TEXT NOT NULL,
  edited_url TEXT NOT NULL,
  edit_prompt TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.image_versions ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own image versions" 
ON public.image_versions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own image versions" 
ON public.image_versions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own image versions" 
ON public.image_versions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own image versions" 
ON public.image_versions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for efficient queries
CREATE INDEX idx_image_versions_post_aspect ON public.image_versions(post_id, aspect_ratio, version_number);
CREATE INDEX idx_image_versions_user ON public.image_versions(user_id, created_at);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_image_versions_updated_at
BEFORE UPDATE ON public.image_versions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();