-- Create jobs table to store scraped job postings
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  platform text NOT NULL, -- 'Greenhouse', 'Lever', 'Workable', 'AngelList', 'RemoteOK'
  location text NOT NULL,
  date_posted date NOT NULL,
  application_url text NOT NULL,
  description text NOT NULL,
  job_type text DEFAULT 'Full-time',
  salary text,
  scraped_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users to view all jobs
CREATE POLICY "Authenticated users can view all jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Create policies for authenticated users to insert jobs (for scraping)
CREATE POLICY "Authenticated users can insert jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Create policies for authenticated users to update jobs
CREATE POLICY "Authenticated users can update jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create policies for authenticated users to delete jobs
CREATE POLICY "Authenticated users can delete jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_jobs_company ON public.jobs(company);
CREATE INDEX idx_jobs_platform ON public.jobs(platform);
CREATE INDEX idx_jobs_date_posted ON public.jobs(date_posted DESC);
CREATE INDEX idx_jobs_location ON public.jobs(location);
CREATE INDEX idx_jobs_is_active ON public.jobs(is_active);

-- Create user bookmarks table
CREATE TABLE public.job_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id uuid REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, job_id)
);

-- Enable RLS on bookmarks
ALTER TABLE public.job_bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies for user bookmarks
CREATE POLICY "Users can view their own bookmarks" 
ON public.job_bookmarks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks" 
ON public.job_bookmarks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks" 
ON public.job_bookmarks 
FOR DELETE 
USING (auth.uid() = user_id);