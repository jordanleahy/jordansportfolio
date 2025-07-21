
-- Create vendor_jobs table
CREATE TABLE public.vendor_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  job_url TEXT NOT NULL,
  job_description TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_jobs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view jobs for published vendors" 
ON public.vendor_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = vendor_jobs.vendor_id 
    AND vendors.status = 'published'
  )
);

CREATE POLICY "Authenticated users can view jobs for their vendors" 
ON public.vendor_jobs 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = vendor_jobs.vendor_id 
    AND vendors.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can create jobs for their vendors" 
ON public.vendor_jobs 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.vendors 
    WHERE vendors.id = vendor_jobs.vendor_id 
    AND vendors.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own jobs" 
ON public.vendor_jobs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs" 
ON public.vendor_jobs 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all jobs" 
ON public.vendor_jobs 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_vendor_jobs_updated_at
BEFORE UPDATE ON public.vendor_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for vendor lookup
CREATE INDEX idx_vendor_jobs_vendor_id ON public.vendor_jobs(vendor_id);
