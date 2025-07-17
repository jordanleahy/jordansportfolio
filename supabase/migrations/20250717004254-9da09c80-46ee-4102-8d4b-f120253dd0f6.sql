-- Create job monitoring configuration tables
CREATE TABLE public.job_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  ats_platform TEXT NOT NULL,
  selector TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.job_monitoring_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title_regex TEXT NOT NULL DEFAULT '(?i)product\\s+designer',
  date_selector TEXT DEFAULT '.publish-date',
  poll_interval_minutes INTEGER NOT NULL DEFAULT 10,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  email_notifications BOOLEAN NOT NULL DEFAULT false,
  webhook_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.job_monitoring_state (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  target_id UUID NOT NULL REFERENCES public.job_targets(id) ON DELETE CASCADE,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  last_job_count INTEGER DEFAULT 0,
  last_jobs_hash TEXT,
  error_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.job_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  target_id UUID NOT NULL REFERENCES public.job_targets(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'new_job',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_monitoring_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_monitoring_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for job_targets
CREATE POLICY "Public can view job targets" ON public.job_targets FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage job targets" ON public.job_targets FOR ALL USING (auth.uid() IS NOT NULL);

-- Create policies for job_monitoring_config
CREATE POLICY "Users can manage their own monitoring config" ON public.job_monitoring_config FOR ALL USING (auth.uid() = user_id);

-- Create policies for job_monitoring_state
CREATE POLICY "Public can view monitoring state" ON public.job_monitoring_state FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage monitoring state" ON public.job_monitoring_state FOR ALL USING (auth.uid() IS NOT NULL);

-- Create policies for job_notifications
CREATE POLICY "Public can view job notifications" ON public.job_notifications FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage job notifications" ON public.job_notifications FOR ALL USING (auth.uid() IS NOT NULL);

-- Create indexes for better performance
CREATE INDEX idx_job_targets_ats_platform ON public.job_targets(ats_platform);
CREATE INDEX idx_job_targets_active ON public.job_targets(is_active);
CREATE INDEX idx_job_monitoring_state_target ON public.job_monitoring_state(target_id);
CREATE INDEX idx_job_monitoring_state_scraped ON public.job_monitoring_state(last_scraped_at);
CREATE INDEX idx_job_notifications_job ON public.job_notifications(job_id);
CREATE INDEX idx_job_notifications_target ON public.job_notifications(target_id);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_job_targets_updated_at
  BEFORE UPDATE ON public.job_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_monitoring_config_updated_at
  BEFORE UPDATE ON public.job_monitoring_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_monitoring_state_updated_at
  BEFORE UPDATE ON public.job_monitoring_state
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default ATS targets
INSERT INTO public.job_targets (name, url, ats_platform, selector) VALUES
('Figma (Greenhouse)', 'https://jobs.lever.co/figma', 'lever', 'div.lever ul > li'),
('Stripe (Greenhouse)', 'https://jobs.greenhouse.io/stripe', 'greenhouse', '.opening'),
('Airbnb (Greenhouse)', 'https://careers.airbnb.com/departments/design/', 'greenhouse', '.opening'),
('Discord (Greenhouse)', 'https://discord.com/jobs', 'greenhouse', '.opening'),
('Notion (Greenhouse)', 'https://www.notion.so/careers', 'greenhouse', '.opening'),
('Linear (Lever)', 'https://jobs.lever.co/linear', 'lever', 'div.lever ul > li'),
('OpenAI (Greenhouse)', 'https://openai.com/careers/search', 'greenhouse', '.opening'),
('Vercel (Lever)', 'https://vercel.com/careers', 'lever', 'div.lever ul > li');

-- Insert default monitoring configuration
INSERT INTO public.job_monitoring_config (user_id, title_regex, poll_interval_minutes) 
SELECT auth.uid(), '(?i)product\\s+designer|(?i)design\\s+lead|(?i)senior\\s+designer', 10
WHERE auth.uid() IS NOT NULL;