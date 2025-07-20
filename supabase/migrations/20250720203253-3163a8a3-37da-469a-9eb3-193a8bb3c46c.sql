
-- Add vendor_images column to store image metadata
ALTER TABLE public.vendors 
ADD COLUMN vendor_images JSONB DEFAULT '[]'::JSONB;

-- Add index for better query performance on vendor_images
CREATE INDEX idx_vendors_images ON public.vendors USING GIN(vendor_images);
