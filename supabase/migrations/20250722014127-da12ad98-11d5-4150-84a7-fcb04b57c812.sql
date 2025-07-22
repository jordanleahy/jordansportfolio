-- Add foreign key relationship between vendors and SEC offerings
ALTER TABLE public.vendors 
ADD COLUMN sec_accession_number text REFERENCES public.offerings(accessionnumber);

-- Create index for better performance on lookups
CREATE INDEX idx_vendors_sec_accession_number ON public.vendors(sec_accession_number);

-- Add constraint to prevent duplicate vendors for the same SEC offering
ALTER TABLE public.vendors 
ADD CONSTRAINT unique_vendor_per_sec_offering 
UNIQUE (sec_accession_number, user_id);