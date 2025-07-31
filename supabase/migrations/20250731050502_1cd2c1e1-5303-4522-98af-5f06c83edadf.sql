-- Create image_seeds table for managing seeds
CREATE TABLE public.image_seeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  seed_value BIGINT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_seed_name UNIQUE(user_id, name),
  CONSTRAINT seed_value_range CHECK (seed_value >= 0 AND seed_value <= 9223372036854775807)
);

-- Enable RLS
ALTER TABLE public.image_seeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can create their own seeds"
  ON public.image_seeds
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own seeds"
  ON public.image_seeds
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own seeds"
  ON public.image_seeds
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seeds"
  ON public.image_seeds
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admin can manage all seeds
CREATE POLICY "Admins can manage all seeds"
  ON public.image_seeds
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_image_seeds_updated_at
  BEFORE UPDATE ON public.image_seeds
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample seeds for testing
INSERT INTO public.image_seeds (user_id, name, seed_value, description, category, is_default)
SELECT 
  auth.uid(),
  'Consistent Healthcare',
  12345678,
  'Reliable seed for healthcare-themed images',
  'healthcare',
  true
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.image_seeds (user_id, name, seed_value, description, category)
SELECT 
  auth.uid(),
  'Business Professional',
  87654321,
  'Clean, professional business imagery',
  'business'
WHERE auth.uid() IS NOT NULL;

INSERT INTO public.image_seeds (user_id, name, seed_value, description, category)
SELECT 
  auth.uid(),
  'Creative Design',
  11223344,
  'Creative and innovative design visuals',
  'design'
WHERE auth.uid() IS NOT NULL;