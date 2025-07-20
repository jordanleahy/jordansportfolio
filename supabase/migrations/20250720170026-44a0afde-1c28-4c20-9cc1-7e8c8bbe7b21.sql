-- Add new columns extracted from company_data JSONB
ALTER TABLE public.vendors 
ADD COLUMN business_model TEXT,
ADD COLUMN employee_count_range TEXT,
ADD COLUMN geographic_presence TEXT,
ADD COLUMN contact_email TEXT,
ADD COLUMN contact_phone TEXT,
ADD COLUMN contact_address TEXT,
ADD COLUMN linkedin_url TEXT,
ADD COLUMN twitter_url TEXT,
ADD COLUMN certifications TEXT[],
ADD COLUMN awards_recognition TEXT[],
ADD COLUMN office_locations TEXT[],
ADD COLUMN partnerships TEXT[],
ADD COLUMN tech_stack TEXT[];

-- Migrate existing data from company_data JSONB to new columns
UPDATE public.vendors 
SET 
  business_model = company_data->>'business_model',
  employee_count_range = company_data->>'employee_count_range',
  geographic_presence = company_data->>'geographic_presence',
  contact_email = company_data->'contact_info'->>'email',
  contact_phone = company_data->'contact_info'->>'phone',
  contact_address = company_data->'contact_info'->>'address',
  linkedin_url = company_data->'social_media'->>'linkedin',
  twitter_url = company_data->'social_media'->>'twitter',
  certifications = CASE 
    WHEN company_data->'certifications' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(company_data->'certifications'))
    ELSE NULL 
  END,
  awards_recognition = CASE 
    WHEN company_data->'awards_recognition' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(company_data->'awards_recognition'))
    ELSE NULL 
  END,
  office_locations = CASE 
    WHEN company_data->'office_locations' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(company_data->'office_locations'))
    ELSE NULL 
  END,
  partnerships = CASE 
    WHEN company_data->'partnerships' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(company_data->'partnerships'))
    ELSE NULL 
  END,
  tech_stack = CASE 
    WHEN company_data->'tech_stack' IS NOT NULL 
    THEN ARRAY(SELECT jsonb_array_elements_text(company_data->'tech_stack'))
    ELSE NULL 
  END
WHERE company_data IS NOT NULL AND company_data != '{}';

-- Create indexes for better query performance
CREATE INDEX idx_vendors_business_model ON public.vendors(business_model);
CREATE INDEX idx_vendors_employee_count ON public.vendors(employee_count_range);
CREATE INDEX idx_vendors_contact_email ON public.vendors(contact_email);
CREATE INDEX idx_vendors_linkedin ON public.vendors(linkedin_url);
CREATE INDEX idx_vendors_certifications ON public.vendors USING GIN(certifications);
CREATE INDEX idx_vendors_tech_stack ON public.vendors USING GIN(tech_stack);