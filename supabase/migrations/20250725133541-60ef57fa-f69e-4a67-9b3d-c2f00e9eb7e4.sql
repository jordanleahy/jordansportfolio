-- Add OG metadata fields to vendors table
ALTER TABLE public.vendors 
ADD COLUMN og_title text,
ADD COLUMN og_description text,
ADD COLUMN og_image_url text;