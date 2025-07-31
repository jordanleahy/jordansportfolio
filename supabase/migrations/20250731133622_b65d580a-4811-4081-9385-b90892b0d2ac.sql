-- Add selected_seed_id column to social_media_posts table for seed management feature
ALTER TABLE public.social_media_posts 
ADD COLUMN selected_seed_id UUID REFERENCES public.image_seeds(id) ON DELETE SET NULL;