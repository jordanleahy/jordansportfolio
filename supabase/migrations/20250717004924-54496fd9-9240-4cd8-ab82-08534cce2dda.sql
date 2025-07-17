-- Add unique constraint for job_monitoring_state upsert
ALTER TABLE public.job_monitoring_state 
ADD CONSTRAINT job_monitoring_state_target_id_unique UNIQUE (target_id);

-- Create default monitoring config for existing users
DO $$
BEGIN
  INSERT INTO public.job_monitoring_config (user_id, title_regex, poll_interval_minutes) 
  SELECT DISTINCT '3e7858df-9613-4285-98d2-ffb818c26f6d', '(?i)product\\s+designer|(?i)design\\s+lead|(?i)senior\\s+designer', 10
  WHERE NOT EXISTS (
    SELECT 1 FROM public.job_monitoring_config 
    WHERE user_id = '3e7858df-9613-4285-98d2-ffb818c26f6d'
  );
END $$;