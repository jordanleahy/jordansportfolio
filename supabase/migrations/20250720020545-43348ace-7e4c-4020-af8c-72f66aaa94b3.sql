
-- Add competitors column to vendors table
ALTER TABLE public.vendors 
ADD COLUMN competitors TEXT[] NOT NULL DEFAULT '{}';
