-- Add logo fields to vendors table
ALTER TABLE public.vendors 
ADD COLUMN social_logo_url text,
ADD COLUMN landscape_logo_url text;